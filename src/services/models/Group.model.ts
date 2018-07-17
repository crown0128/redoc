import { action, observable } from 'mobx';

import { OpenAPIExternalDocumentation, OpenAPITag } from '../../types';
import { safeSlugify } from '../../utils';
import { MarkdownHeading } from '../MarkdownRenderer';
import { ContentItemModel } from '../MenuBuilder';
import { IMenuItem, MenuItemGroupType } from '../MenuStore';

/**
 * Operations Group model ready to be used by components
 */
export class GroupModel implements IMenuItem {
  //#region IMenuItem fields
  id: string;
  absoluteIdx?: number;
  name: string;
  description?: string;
  type: MenuItemGroupType;

  items: ContentItemModel[] = [];
  parent?: GroupModel;
  externalDocs?: OpenAPIExternalDocumentation;

  @observable active: boolean = false;

  depth: number;
  //#endregion

  constructor(
    type: MenuItemGroupType,
    tagOrGroup: OpenAPITag | MarkdownHeading,
    parent?: GroupModel,
  ) {
    // markdown headings already have ids calculated as they are needed for heading anchors
    this.id = (tagOrGroup as MarkdownHeading).id || type + '/' + safeSlugify(tagOrGroup.name);
    this.type = type;
    this.name = tagOrGroup['x-displayName'] || tagOrGroup.name;
    this.description = tagOrGroup.description || '';
    this.parent = parent;
    this.externalDocs = (tagOrGroup as OpenAPITag).externalDocs;

    // groups are active (expanded) by default
    if (this.type === 'group') {
      this.active = true;
    }
  }

  @action
  activate() {
    this.active = true;
  }

  @action
  deactivate() {
    // disallow deactivating groups
    if (this.type === 'group') {
      return;
    }
    this.active = false;
  }
}
