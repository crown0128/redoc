'use strict';

import { Injectable } from '@angular/core';
import * as slugify from 'slugify';
import * as Remarkable from 'remarkable';

declare var Prism: any;
const md = new Remarkable({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false,
  highlight: (str, lang) => {
    if (lang === 'json') lang = 'js';
    let grammar = Prism.languages[lang];
    //fallback to clike
    if (!grammar) return str;
    return Prism.highlight(str, grammar);
  }
});

interface HeadersHandler {
  open: Function;
  close: Function;
}

@Injectable()
export class MdRenderer {
  public firstLevelHeadings: string[] = [];

  private _origRules:any = {};
  private _preProcessors:Function[] = [];

  constructor(private raw: boolean = false) {
  }

  addPreprocessor(p: Function) {
    this._preProcessors.push(p);
  }

  saveOrigRules() {
    this._origRules.open = md.renderer.rules.heading_open;
    this._origRules.close = md.renderer.rules.heading_close;
  }

  restoreOrigRules() {
    md.renderer.rules.heading_open = this._origRules.open;
    md.renderer.rules.heading_close = this._origRules.close;
  }

  headingOpenRule(tokens, idx) {
    if (tokens[idx].hLevel !== 1 ) {
      return this._origRules.open(tokens, idx);
    } else {
      let content = tokens[idx + 1].content;
      this.firstLevelHeadings.push(content);
      let contentSlug = slugify(content);
      return `<h${tokens[idx].hLevel} section="section/${contentSlug}">` +
        `<a class="share-link" href="#section/${contentSlug}"></a>`;
    }
  }

  headingCloseRule(tokens, idx) {
    if (tokens[idx].hLevel !== 1 ) {
      return this._origRules.close(tokens, idx);
    } else {
      return `</h${tokens[idx].hLevel}>\n`;
    }
  }

  renderMd(rawText:string) {
    if (!this.raw) {
      this.saveOrigRules();
      md.renderer.rules.heading_open = this.headingOpenRule.bind(this);
      md.renderer.rules.heading_close = this.headingCloseRule.bind(this);
    }
    let text = rawText;

    for (let i=0; i<this._preProcessors.length; i++) {
      text = this._preProcessors[i](text);
    }

    let res =  md.render(text);

    if (!this.raw) {
      this.restoreOrigRules();
    }
    return res;
  }
}
