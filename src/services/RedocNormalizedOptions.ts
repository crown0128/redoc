import { ThemeInterface } from '../theme';
import { isNumeric } from '../utils/helpers';
import defaultTheme from '../theme';

export interface RedocRawOptions {
  theme?: ThemeInterface;
  scrollYOffset?: number | string | Function;
  hideHostname?: boolean | string;
  expandResponses?: string | 'all';
}

export class RedocNormalizedOptions {
  theme: ThemeInterface;
  scrollYOffset: () => number;
  hideHostname: boolean;
  expandResponses: { [code: string]: boolean } | 'all';

  constructor(raw: RedocRawOptions) {
    this.theme = { ...(raw.theme || {}), ...defaultTheme }; // todo: merge deep
    this.scrollYOffset = RedocNormalizedOptions.normalizeScrollYOffset(raw.scrollYOffset);
    this.hideHostname = RedocNormalizedOptions.normalizeHideHostname(raw.hideHostname);
    this.expandResponses = RedocNormalizedOptions.normalizeExpandResponses(raw.expandResponses);
  }

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
    } else {
      console.warn(
        `expandResponses must be a string but received value "${value}" of type ${typeof value}`,
      );
      return {};
    }
  }

  static normalizeHideHostname(value: RedocRawOptions['hideHostname']): boolean {
    return !!value;
  }

  static normalizeScrollYOffset(value: RedocRawOptions['scrollYOffset']): () => number {
    // just number is not valid selector and leads to crash so checking if isNumeric here
    if (typeof value === 'string' && !isNumeric(value)) {
      const el = document.querySelector(value);
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
}
