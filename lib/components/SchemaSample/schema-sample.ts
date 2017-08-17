'use strict';

import { Component, ElementRef, Input, ChangeDetectionStrategy, OnInit } from '@angular/core';

import * as OpenAPISampler from 'openapi-sampler';
import JsonPointer from '../../utils/JsonPointer';
import { BaseComponent, SpecManager } from '../base';
import { SchemaNormalizer } from '../../services/schema-normalizer.service';
import { getJsonLikeSample, getXmlLikeSample, getTextLikeSample } from '../../utils/helpers';

@Component({
  selector: 'schema-sample',
  templateUrl: './schema-sample.html',
  styleUrls: ['./schema-sample.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaSample extends BaseComponent implements OnInit {
  @Input() pointer:string;
  @Input() skipReadOnly:boolean;

  element: any;
  sample: any;
  xmlSample: string;
  textSample: string;
  enableButtons: boolean = false;

  private _normalizer:SchemaNormalizer;

  constructor(specMgr:SpecManager, elementRef:ElementRef) {
    super(specMgr);
    this.element = elementRef.nativeElement;
    this._normalizer = new SchemaNormalizer(specMgr);
  }

  init() {
    this.bindEvents();

    let base:any = this.componentSchema;
    let sample, xmlSample;

    // got pointer not directly to the schema but e.g. to the response obj
    if (this.componentSchema.schema) {
      base = this.componentSchema;
      this.componentSchema = this.componentSchema.schema;
      this.pointer += '/schema';
    }

    // Support x-examples, allowing requests to specify an example.
    let examplePointer:string = JsonPointer.join(JsonPointer.dirName(this.pointer), 'x-examples');
    let requestExamples:any = this.specMgr.byPointer(examplePointer);
    if (requestExamples) {
      base.examples = requestExamples;
    }

    this.xmlSample = base.examples && getXmlLikeSample(base.examples);
    this.textSample = base.examples && getTextLikeSample(base.examples);

    let jsonLikeSample = base.examples && getJsonLikeSample(base.examples);
    if (jsonLikeSample) {
      sample = jsonLikeSample;
    } else {
      let selectedDescendant;

      this.componentSchema = this._normalizer.normalize(this.componentSchema, this.pointer);

      let discriminator = this.componentSchema.discriminator || this.componentSchema['x-discriminatorBasePointer'];
      if (discriminator) {
        let descendants = this.specMgr.findDerivedDefinitions(this.componentSchema._pointer || this.pointer, this.componentSchema);
        if (descendants.length) {
          // TODO: sync up with dropdown
          selectedDescendant = descendants[0];
          let descSchema = this.specMgr.getDescendant(selectedDescendant, this.componentSchema);
          this.componentSchema  = this._normalizer.normalize(Object.assign({}, descSchema), selectedDescendant.$ref,
            {omitParent: false});
        }
      }
      if (this.fromCache()) {
        this.initButtons();
        return;
      }
      try {
        sample = OpenAPISampler.sample(this.componentSchema, {
          skipReadOnly: this.skipReadOnly
        });
      } catch(e) {
        // no sample available
      }
      if (selectedDescendant) {
        sample[discriminator] = selectedDescendant.name;
      }
    }
    this.cache(sample);
    this.sample = sample;
    this.initButtons();
  }

  initButtons() {
    if (typeof this.sample === 'object') {
      this.enableButtons = true;
    }
  }

  cache(sample) {
    if (this.skipReadOnly) {
      this.componentSchema['x-redoc-ro-sample'] = sample;
    } else {
      this.componentSchema['x-redoc-rw-sample'] = sample;
    }
  }

  fromCache() {
    if (this.skipReadOnly && this.componentSchema['x-redoc-ro-sample']) {
      this.sample = this.componentSchema['x-redoc-ro-sample'];
      return true;
    } else if (!this.skipReadOnly && this.componentSchema['x-redoc-rw-sample']) {
      this.sample = this.componentSchema['x-redoc-rw-sample'];
      return true;
    }
    return false;
  }

  bindEvents() {
    this.element.addEventListener('click', (event) => {
      var collapsed, target = event.target;
      if (event.target.className === 'collapser') {
        collapsed = target.parentNode.getElementsByClassName('collapsible')[0];
        if (collapsed.parentNode.classList.contains('collapsed')) {
          collapsed.parentNode.classList.remove('collapsed');
        } else {
          collapsed.parentNode.classList.add('collapsed');
        }
      }
    });
  }

  expandAll() {
    let elements = this.element.getElementsByClassName('collapsible');
    for (let i = 0; i < elements.length; i++) {
      let collapsed = elements[i];
      collapsed.parentNode.classList.remove('collapsed');
    }
  }

  collapseAll() {
    let elements = this.element.getElementsByClassName('collapsible');
    for (let i = 0; i < elements.length; i++) {
      let expanded = elements[i];
      if (expanded.parentNode.classList.contains('redoc-json')) continue;
      expanded.parentNode.classList.add('collapsed');
    }
  }

  ngOnInit() {
    this.preinit();
  }
}
