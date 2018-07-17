import { observe } from 'mobx';

import { OpenAPISpec } from '../types';
import { loadAndBundleSpec } from '../utils/loadAndBundleSpec';
import { HistoryService } from './HistoryService';
import { MarkerService } from './MarkerService';
import { MenuStore } from './MenuStore';
import { SpecStore } from './models';
import { RedocNormalizedOptions, RedocRawOptions } from './RedocNormalizedOptions';
import { ScrollService } from './ScrollService';
import { SearchStore } from './SearchStore';

export interface StoreState {
  menu: {
    activeItemIdx: number;
  };
  spec: {
    url: string;
    data: any;
  };
  searchIndex: any;
  options: RedocRawOptions;
}

export async function createStore(
  spec: object,
  specUrl: string | undefined,
  options: RedocRawOptions = {},
) {
  const resolvedSpec = await loadAndBundleSpec(spec || specUrl);
  return new AppStore(resolvedSpec, specUrl, options);
}

export class AppStore {
  /**
   * deserialize store
   * **SUPER HACKY AND NOT OPTIMAL IMPLEMENTATION**
   */
  // TODO:
  static fromJS(state: StoreState): AppStore {
    const inst = new AppStore(state.spec.data, state.spec.url, state.options, false);
    inst.menu.activeItemIdx = state.menu.activeItemIdx || 0;
    inst.menu.activate(inst.menu.flatItems[inst.menu.activeItemIdx]);
    if (!inst.options.disableSearch) {
      inst.search!.load(state.searchIndex);
    }
    return inst;
  }

  menu: MenuStore;
  spec: SpecStore;
  rawOptions: RedocRawOptions;
  options: RedocNormalizedOptions;
  search?: SearchStore<string>;
  marker = new MarkerService();

  private scroll: ScrollService;
  private disposer;

  constructor(
    spec: OpenAPISpec,
    specUrl?: string,
    options: RedocRawOptions = {},
    createSearchIndex: boolean = true,
  ) {
    this.rawOptions = options;
    this.options = new RedocNormalizedOptions(options);
    this.scroll = new ScrollService(this.options);

    // update position statically based on hash (in case of SSR)
    MenuStore.updateOnHash(HistoryService.hash, this.scroll);

    this.spec = new SpecStore(spec, specUrl, this.options);
    this.menu = new MenuStore(this.spec, this.scroll);

    if (!this.options.disableSearch) {
      this.search = new SearchStore();
      if (createSearchIndex) {
        this.search.indexItems(this.menu.items);
      }

      this.disposer = observe(this.menu, 'activeItemIdx', change => {
        this.updateMarkOnMenu(change.newValue as number);
      });
    }
  }

  onDidMount() {
    this.menu.updateOnHash();
    this.updateMarkOnMenu(this.menu.activeItemIdx);
  }

  updateMarkOnMenu(idx: number) {
    const start = Math.max(0, idx);
    const end = Math.min(this.menu.flatItems.length, start + 5);

    const elements: Element[] = [];
    for (let i = start; i < end; i++) {
      let elem = this.menu.getElementAt(i);
      if (!elem) {
        continue;
      }
      if (this.menu.flatItems[i].type === 'section') {
        elem = elem.parentElement!.parentElement;
      }
      if (elem) {
        elements.push(elem);
      }
    }

    this.marker.addOnly(elements);
    this.marker.mark();
  }

  dispose() {
    this.scroll.dispose();
    this.menu.dispose();
    this.disposer();
  }

  /**
   * serializes store
   * **SUPER HACKY AND NOT OPTIMAL IMPLEMENTATION**
   */
  // TODO:
  async toJS(): Promise<StoreState> {
    return {
      menu: {
        activeItemIdx: this.menu.activeItemIdx,
      },
      spec: {
        url: this.spec.parser.specUrl,
        data: this.spec.parser.spec,
      },
      searchIndex: this.search ? await this.search.toJS() : undefined,
      options: this.rawOptions,
    };
  }
}
