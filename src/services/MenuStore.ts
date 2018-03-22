import { action, computed, observable } from 'mobx';
import { querySelector } from '../utils/dom';
import { GroupModel, OperationModel, SpecStore } from './models';

import { HistoryService } from './HistoryService';
import { ScrollService } from './ScrollService';

import { flattenByProp, normalizeHash } from '../utils';
import { GROUP_DEPTH } from './MenuBuilder';

export type MenuItemGroupType = 'group' | 'tag' | 'section';
export type MenuItemType = MenuItemGroupType | 'operation';

/** Generic interface for MenuItems */
export interface IMenuItem {
  id: string;
  absoluteIdx?: number;
  name: string;
  description?: string;
  depth: number;
  active: boolean;
  items: IMenuItem[];
  parent?: IMenuItem;
  deprecated?: boolean;
  type: MenuItemType;

  deactivate(): void;
  activate(): void;
}

export const SECTION_ATTR = 'data-section-id';

/**
 * Stores all side-menu related information
 */
export class MenuStore {
  /**
   * Statically try update scroll position
   * Used before hydrating from server-side rendered html to scroll page faster
   */
  static updateOnHash(hash: string = HistoryService.hash, scroll: ScrollService) {
    if (!hash) {
      return;
    }
    scroll.scrollIntoViewBySelector(`[${SECTION_ATTR}="${normalizeHash(hash)}"]`);
  }

  /**
   * active item absolute index (when flattened). -1 means nothing is selected
   */
  @observable activeItemIdx: number = -1;

  /**
   * whether sidebar with menu is opened or not
   */
  @observable sideBarOpened: boolean = false;

  /**
   * cached flattened menu items to support absolute indexing
   */
  private _unsubscribe: () => void;
  private _hashUnsubscribe: () => void;
  private _items?: Array<GroupModel | OperationModel>;

  /**
   *
   * @param spec [SpecStore](#SpecStore) which contains page content structure
   * @param _scrollService scroll service instance used by this menu
   */
  constructor(private spec: SpecStore, private _scrollService: ScrollService) {
    this._unsubscribe = _scrollService.subscribe(this.updateOnScroll);
    this._hashUnsubscribe = HistoryService.subscribe(this.updateOnHash);
  }

  @action
  toggleSidebar() {
    this.sideBarOpened = this.sideBarOpened ? false : true;
  }

  @action
  closeSidebar() {
    this.sideBarOpened = false;
  }

  /**
   * top level menu items (not flattened)
   */
  @computed
  get items(): IMenuItem[] {
    if (!this._items) {
      this._items = this.spec.operationGroups;
    }
    return this._items;
  }

  /**
   * update active items on scroll
   * @param isScrolledDown whether last scroll was downside
   */
  @action.bound
  updateOnScroll(isScrolledDown: boolean): void {
    const step = isScrolledDown ? 1 : -1;
    let itemIdx = this.activeItemIdx;
    while (true) {
      if (itemIdx === -1 && !isScrolledDown) {
        break;
      }

      if (itemIdx >= this.flatItems.length - 1 && isScrolledDown) {
        break;
      }

      if (isScrolledDown) {
        const el = this.getElementAt(itemIdx + 1);
        if (this._scrollService.isElementBellow(el)) {
          break;
        }
      } else {
        const el = this.getElementAt(itemIdx);
        if (this._scrollService.isElementAbove(el)) {
          break;
        }
      }
      itemIdx += step;
    }

    this.activate(this.flatItems[itemIdx], true, true);
  }

  /**
   * update active items on hash change
   * @param hash current hash
   */
  @action.bound
  updateOnHash(hash: string = HistoryService.hash): boolean {
    if (!hash) {
      return false;
    }
    let item: IMenuItem | undefined;
    hash = normalizeHash(hash);

    item = this.flatItems.find(i => i.id === hash);
    if (item) {
      this.activateAndScroll(item, false);
    } else {
      this._scrollService.scrollIntoViewBySelector(`[${SECTION_ATTR}="${hash}"]`);
    }
    return item !== undefined;
  }

  /**
   * get section/operation DOM Node related to the item or null if it doesn't exist
   * @param idx item absolute index
   */
  getElementAt(idx: number): Element | null {
    const item = this.flatItems[idx];
    return (item && querySelector(`[${SECTION_ATTR}="${item.id}"]`)) || null;
  }

  /**
   * current active item
   */
  get activeItem(): IMenuItem {
    return this.flatItems[this.activeItemIdx] || undefined;
  }

  getItemById = (id: string) => {
    return this.flatItems.find(item => item.id === id);
  };

  /**
   * flattened items as they appear in the tree depth-first (top to bottom in the view)
   */
  @computed
  get flatItems(): IMenuItem[] {
    const flatItems = flattenByProp(this._items || [], 'items');
    flatItems.forEach((item, idx) => (item.absoluteIdx = idx));
    return flatItems;
  }

  /**
   * activate menu item
   * @param item item to activate
   * @param updateHash [true] whether to update location hash
   * @param rewriteHistory [false] whether to rewrite browser history (do not create new enrty)
   */
  @action
  activate(
    item: IMenuItem | undefined,
    updateHash: boolean = true,
    rewriteHistory: boolean = false,
  ) {
    if ((this.activeItem && this.activeItem.id) === (item && item.id)) {
      return;
    }
    this.deactivate(this.activeItem);
    if (!item) {
      HistoryService.update('', rewriteHistory);
      return;
    }

    // do not allow activating group items
    // TODO: control over options
    if (item.depth <= GROUP_DEPTH) {
      return;
    }

    this.activeItemIdx = item.absoluteIdx!;
    if (updateHash) {
      HistoryService.update(item.id, rewriteHistory);
    }

    while (item !== undefined) {
      item.activate();
      item = item.parent;
    }
  }

  /**
   * makes item and all the parents not active
   * @param item item to deactivate
   */
  deactivate(item: IMenuItem | undefined) {
    while (item !== undefined) {
      item.deactivate();
      item = item.parent;
    }
  }

  /**
   * activate menu item and scroll to it
   * @see MenuStore.activate
   */
  @action.bound
  activateAndScroll(item: IMenuItem | undefined, updateHash?: boolean, rewriteHistory?: boolean) {
    // item here can be a copy from search results so find corresponding item from menu
    const menuItem = (item && this.getItemById(item.id)) || item;
    this.activate(menuItem, updateHash, rewriteHistory);
    this.scrollToActive();
    if (!menuItem || !menuItem.items.length) {
      this.closeSidebar();
    }
  }

  /**
   * scrolls to active section
   */
  scrollToActive(): void {
    this._scrollService.scrollIntoView(this.getElementAt(this.activeItemIdx));
  }

  dispose() {
    this._unsubscribe();
    this._hashUnsubscribe();
  }
}
