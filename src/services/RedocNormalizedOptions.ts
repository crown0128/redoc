import defaultTheme, { ResolvedThemeInterface, resolveTheme, ThemeInterface } from '../theme';
import { querySelector } from '../utils/dom';
import { isNumeric, mergeObjects } from '../utils/helpers';

import { MDXComponentMeta } from './MarkdownRenderer';

export interface RedocRawOptions {
  theme?: ThemeInterface;
  scrollYOffset?: number | string | (() => number);
  hideHostname?: boolean | string;
  expandResponses?: string | 'all';
  requiredPropsFirst?: boolean | string;
  sortPropsAlphabetically?: boolean | string;
  noAutoAuth?: boolean | string;
  nativeScrollbars?: boolean | string;
  pathInMiddlePanel?: boolean | string;
  untrustedSpec?: boolean | string;
  hideLoading?: boolean | string;
  hideDownloadButton?: boolean | string;
  disableSearch?: boolean | string;
  onlyRequiredInSamples?: boolean | string;
  showExtensions?: boolean | string | string[];

  unstable_ignoreMimeParameters?: boolean;

  allowedMdComponents?: Dict<MDXComponentMeta>;
}

function argValueToBoolean(val?: string | boolean): boolean {
  if (val === undefined) {
    return false;
  }
  if (typeof val === 'string') {
    return true;
  }
  return val;
}

export class RedocNormalizedOptions {
  static normalizeExpandResponses(value: RedocRawOptions['expandResponses']) {
    if (value === 'all') {
      return 'all';
    }
    if (typeof value === 'string') {
      const res = {};
      value.split(',').forEach(code => {
        res[code.trim()] = true;
      });
      return res;
    } else if (value !== undefined) {
      console.warn(
        `expandResponses must be a string but received value "${value}" of type ${typeof value}`,
      );
    }
    return {};
  }

  static normalizeHideHostname(value: RedocRawOptions['hideHostname']): boolean {
    return !!value;
  }

  static normalizeScrollYOffset(value: RedocRawOptions['scrollYOffset']): () => number {
    // just number is not valid selector and leads to crash so checking if isNumeric here
    if (typeof value === 'string' && !isNumeric(value)) {
      const el = querySelector(value);
      if (!el) {
        console.warn(
          'scrollYOffset value is a selector to non-existing element. Using offset 0 by default',
        );
      }
      const bottom = (el && el.getBoundingClientRect().bottom) || 0;
      return () => bottom;
    } else if (typeof value === 'number' || isNumeric(value)) {
      return () => (typeof value === 'number' ? value : parseFloat(value));
    } else if (typeof value === 'function') {
      return () => {
        const res = value();
        if (typeof res !== 'number') {
          console.warn(
            `scrollYOffset should return number but returned value "${res}" of type ${typeof res}`,
          );
        }
        return res;
      };
    } else if (value !== undefined) {
      console.warn(
        'Wrong value for scrollYOffset ReDoc option: should be string, number or function',
      );
    }

    return () => 0;
  }

  static normalizeShowExtensions(value: RedocRawOptions['showExtensions']): string[] | boolean {
    if (typeof value === 'undefined') {
      return false;
    }
    if (value === '') {
      return true;
    }

    if (typeof value === 'string') {
      return value.split(',').map(ext => ext.trim());
    }

    return value;
  }

  theme: ResolvedThemeInterface;
  scrollYOffset: () => number;
  hideHostname: boolean;
  expandResponses: { [code: string]: boolean } | 'all';
  requiredPropsFirst: boolean;
  sortPropsAlphabetically: boolean;
  noAutoAuth: boolean;
  nativeScrollbars: boolean;
  pathInMiddlePanel: boolean;
  untrustedSpec: boolean;
  hideDownloadButton: boolean;
  disableSearch: boolean;
  onlyRequiredInSamples: boolean;
  showExtensions: boolean | string[];

  /* tslint:disable-next-line */
  unstable_ignoreMimeParameters: boolean;
  allowedMdComponents: Dict<MDXComponentMeta>;

  constructor(raw: RedocRawOptions, defaults: RedocRawOptions = {}) {
    raw = { ...defaults, ...raw };
    const hook = raw.theme && raw.theme.extensionsHook;
    this.theme = resolveTheme(
      mergeObjects({} as any, defaultTheme, { ...raw.theme, extensionsHook: undefined }),
    );

    this.theme.extensionsHook = hook as any;

    this.scrollYOffset = RedocNormalizedOptions.normalizeScrollYOffset(raw.scrollYOffset);
    this.hideHostname = RedocNormalizedOptions.normalizeHideHostname(raw.hideHostname);
    this.expandResponses = RedocNormalizedOptions.normalizeExpandResponses(raw.expandResponses);
    this.requiredPropsFirst = argValueToBoolean(raw.requiredPropsFirst);
    this.sortPropsAlphabetically = argValueToBoolean(raw.sortPropsAlphabetically);
    this.noAutoAuth = argValueToBoolean(raw.noAutoAuth);
    this.nativeScrollbars = argValueToBoolean(raw.nativeScrollbars);
    this.pathInMiddlePanel = argValueToBoolean(raw.pathInMiddlePanel);
    this.untrustedSpec = argValueToBoolean(raw.untrustedSpec);
    this.hideDownloadButton = argValueToBoolean(raw.hideDownloadButton);
    this.disableSearch = argValueToBoolean(raw.disableSearch);
    this.onlyRequiredInSamples = argValueToBoolean(raw.onlyRequiredInSamples);
    this.showExtensions = RedocNormalizedOptions.normalizeShowExtensions(raw.showExtensions);

    this.unstable_ignoreMimeParameters = argValueToBoolean(raw.unstable_ignoreMimeParameters);

    this.allowedMdComponents = raw.allowedMdComponents || {};
  }
}
