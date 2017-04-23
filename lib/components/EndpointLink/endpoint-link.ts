'use strict';
import { Component, ChangeDetectionStrategy, Input, OnInit, HostListener, HostBinding} from '@angular/core';
import { BaseComponent, SpecManager } from '../base';
import { OptionsService } from '../../services/';
import { stripTrailingSlash } from '../../utils/';

export interface ServerInfo {
  description: string;
  url: string;
}

@Component({
  selector: 'endpoint-link',
  styleUrls: ['./endpoint-link.css'],
  templateUrl: './endpoint-link.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndpointLink implements OnInit {
  @Input() path:string;
  @Input() verb:string;

  apiUrl: string;
  servers: ServerInfo[];
  @HostBinding('class.expanded') expanded: boolean = false;

  // @HostListener('click')
  handleClick() {
    this.expanded = !this.expanded;
  }

  constructor(public specMgr:SpecManager, public optionsService: OptionsService) {
    this.expanded = false;
  }

  init() {
    let servers:ServerInfo[] = this.specMgr.schema['x-servers'];
    if (servers) {
      this.servers = servers.map(({url, description}) => ({
        description,
        url: stripTrailingSlash(url.startsWith('//') ? `${this.specMgr.apiProtocol}:${url}` : url)
      }));
    } else {
      this.servers = [
        {
          description: 'Server URL',
          url: this.getBaseUrl()
        }
      ];
    }
  }

  getBaseUrl():string {
    if (this.optionsService.options.hideHostname) {
      return '';
    } else {
      return this.specMgr.apiUrl;
    }
  }

  ngOnInit() {
    this.init();
  }
}
