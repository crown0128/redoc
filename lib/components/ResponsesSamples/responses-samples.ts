'use strict';

import { Component, Input, OnInit } from '@angular/core';
import { BaseComponent, SpecManager } from '../base';
import JsonPointer from '../../utils/JsonPointer';
import { statusCodeType } from '../../utils/helpers';


function isNumeric(n) {
  return (!isNaN(parseFloat(n)) && isFinite(n));
}

function hasExample(response) {
  return ((response.examples && response.examples['application/json']) ||
    response.schema);
}

@Component({
  selector: 'responses-samples',
  templateUrl: './responses-samples.html',
  styleUrls: ['./responses-samples.css'],
})
export class ResponsesSamples extends BaseComponent implements OnInit {
  @Input() pointer:string;

  data: any;

  constructor(specMgr:SpecManager) {
    super(specMgr);
  }

  init() {
    this.data = {};
    this.data.responses = [];

    let responses = this.componentSchema;
    if (!responses) return;

    responses = Object.keys(responses).filter(respCode => {
      // only response-codes and "default"
      return ( isNumeric(respCode) || (respCode === 'default'));
    }).map(respCode => {
      let resp = responses[respCode];
      resp.pointer = JsonPointer.join(this.pointer, respCode);
      if (resp.$ref) {
        let ref = resp.$ref;
        resp = this.specMgr.byPointer(resp.$ref);
        resp.pointer = ref;
      }

      resp.code = respCode;
      resp.type = statusCodeType(resp.code);
      return resp;
    })
    .filter(response => hasExample(response));
    this.data.responses = responses;
  }

  ngOnInit() {
    this.preinit();
  }
}
