'use strict';
import { JsonPointer } from '../utils/JsonPointer';
import { methods as swaggerMethods, keywordTypes } from  '../utils/swagger-defs';
import { WarningsService } from './warnings.service';
import * as slugify from 'slugify';

interface PropertyPreprocessOptions {
  childFor: string;
  skipReadOnly?: boolean;
}

export interface MenuMethod {
  active: boolean;
  summary: string;
  tag: string;
  pointer: string;
  operationId: string;
  ready: boolean;
}

export interface MenuItem {
  id: string;

  name: string;
  description?: string;

  items?: Array<MenuItem>;
  parent?: MenuItem;

  active?: boolean;
  ready?: boolean;

  level?: number;
  flatIdx?: number;

  metadata?: any;
}

// global var for this module
var specMgrInstance;

const injectors = {
  notype: {
    check: (propertySchema) => !propertySchema.type,
    inject: (injectTo, propertySchema, pointer) => {
      injectTo.type = SchemaHelper.detectType(propertySchema);
      propertySchema.type = injectTo.type;
      if (injectTo.type) {
        let message = `No "type" specified at "${pointer}". Automatically detected: "${injectTo.type}"`;
        WarningsService.warn(message);
      }
    }
  },
  general: {
    check: () => true,
    inject: (injectTo, propertySchema, pointer) => {
      injectTo._pointer = propertySchema._pointer || pointer;
      injectTo._displayType = propertySchema.type;
      if (propertySchema.format) injectTo._displayFormat = `<${propertySchema.format}>`;
      if (propertySchema.enum) {
        injectTo.enum = propertySchema.enum.map((value) => {
          return {val: value, type: typeof value};
        });
        if (propertySchema.enum && propertySchema.enum.length === 1) {
          injectTo._enumItem = propertySchema.enum[0];
          injectTo.enum = null;
        }
      }
    }
  },
  discriminator: {
    check: (propertySchema) => propertySchema.discriminator || propertySchema['x-extendedDiscriminator'],
    inject: (injectTo, propertySchema = injectTo) => {
      injectTo.discriminator = propertySchema.discriminator;
      injectTo['x-extendedDiscriminator'] = propertySchema['x-extendedDiscriminator'];
    }
  },
  simpleArray: {
    check: (propertySchema) => {
      return propertySchema.type === 'array' && !Array.isArray(propertySchema.items);
    },
    inject: (injectTo, propertySchema = injectTo, propPointer) => {
      if (!(SchemaHelper.detectType(propertySchema.items) === 'object')) {
        injectTo._isArray = true;
        injectTo._pointer = propertySchema.items._pointer
          || JsonPointer.join(propertySchema._pointer || propPointer, ['items']);

        SchemaHelper.runInjectors(injectTo, propertySchema.items, propPointer);
      } else {
        injectors.object.inject(injectTo, propertySchema.items);
      }
      injectTo._widgetType = 'array';
    }
  },
  tuple: {
    check: (propertySchema) => {
      return propertySchema.type === 'array' && Array.isArray(propertySchema.items);
    },
    inject: (injectTo, propertySchema = injectTo, propPointer) => {
      injectTo._isTuple = true;
      injectTo._displayType = '';
      let itemsPtr = JsonPointer.join(propertySchema._pointer || propPointer, ['items']);
      for (let i=0; i < propertySchema.items.length; i++) {
        let itemSchema = propertySchema.items[i];
        itemSchema._pointer = itemSchema._pointer || JsonPointer.join(itemsPtr, [i.toString()]);
      }
      injectTo._widgetType = 'tuple';
    }
  },
  object: {
    check: (propertySchema) => {
      return propertySchema.type === 'object' && (propertySchema.properties ||
        typeof propertySchema.additionalProperties === 'object');
    },
    inject: (injectTo, propertySchema = injectTo) => {
      let baseName = propertySchema._pointer && JsonPointer.baseName(propertySchema._pointer);
      injectTo._displayType = propertySchema.title || baseName || 'object';
      injectTo._widgetType = 'object';
    }
  },
  noType: {
    check: (propertySchema) => !propertySchema.type,
    inject: (injectTo) => {
      injectTo._displayType = '< anything >';
      injectTo._displayTypeHint = 'This field may contain data of any type';
      injectTo.isTrivial = true;
      injectTo._widgetType = 'trivial';
      injectTo._pointer = undefined;
    }
  },
  simpleType: {
    check: (propertySchema) => {
      if (propertySchema.type === 'object') {
        return (!propertySchema.properties || !Object.keys(propertySchema.properties).length)
          && (typeof propertySchema.additionalProperties !== 'object');
      }
      return (propertySchema.type !== 'array') && propertySchema.type;
    },
    inject: (injectTo, propertySchema = injectTo) => {
      injectTo.isTrivial = true;
      if (injectTo._pointer) {
        injectTo._pointer = undefined;
        injectTo._displayType = propertySchema.title ?
          `${propertySchema.title} (${propertySchema.type})` : propertySchema.type;
      }
      injectTo._widgetType = 'trivial';
    }
  },
  integer: {
    check: (propertySchema) => (propertySchema.type === 'integer' || propertySchema.type === 'number'),
    inject: (injectTo, propertySchema = injectTo) => {
      var range = '';
      if (propertySchema.minimum != undefined && propertySchema.maximum != undefined) {
        range += propertySchema.exclusiveMinimum ? '( ' : '[ ';
        range += propertySchema.minimum;
        range += ' .. ';
        range += propertySchema.maximum;
        range += propertySchema.exclusiveMaximum ? ' )' : ' ]';
      } else if (propertySchema.maximum != undefined) {
        range += propertySchema.exclusiveMaximum? '< ' : '<= ';
        range += propertySchema.maximum;
      } else if (propertySchema.minimum != undefined) {
        range += propertySchema.exclusiveMinimum ? '> ' : '>= ';
        range += propertySchema.minimum;
      }

      if (range) {
        injectTo._range = range;
      }
    }
  },
  string: {
    check: propertySchema => (propertySchema.type === 'string'),
    inject: (injectTo, propertySchema = injectTo) => {
      var range;
      if (propertySchema.minLength != undefined && propertySchema.maxLength != undefined) {
        range = `[ ${propertySchema.minLength} .. ${propertySchema.maxLength} ]`;
      } else if (propertySchema.maxLength != undefined) {
        range = '<= ' + propertySchema.maxLength;
      } else if (propertySchema.minLength != undefined) {
        range = '>= ' + propertySchema.minLength;
      }

      if (range) {
        injectTo._range = range + ' characters';
      }
    }
  },
  file: {
    check: propertySchema => (propertySchema.type === 'file'),
    inject: (injectTo, propertySchema = injectTo, _, hostPointer) => {
      injectTo.isFile = true;
      let parentPtr;
      if (propertySchema.in === 'formData') {
        parentPtr = JsonPointer.dirName(hostPointer, 1);
      } else {
        parentPtr = JsonPointer.dirName(hostPointer, 3);
      }

      let parentParam = specMgrInstance.byPointer(parentPtr);
      let root =specMgrInstance.schema;
      injectTo._produces = parentParam && parentParam.produces || root.produces;
      injectTo._consumes = parentParam && parentParam.consumes || root.consumes;
      injectTo._widgetType = 'file';
    }
  }
};

export class SchemaHelper {
  static setSpecManager(specMgr) {
    specMgrInstance = specMgr;
  }

  static preprocess(schema, pointer, hostPointer?) {
    //propertySchema = Object.assign({}, propertySchema);
    if (schema['x-redoc-schema-precompiled']) {
      return schema;
    }
    SchemaHelper.runInjectors(schema, schema, pointer, hostPointer);
    schema['x-redoc-schema-precompiled'] = true;
    return schema;
  }

  static runInjectors(injectTo, schema, pointer, hostPointer?) {
    for (var injName of Object.keys(injectors)) {
      let injector = injectors[injName];
      if (injector.check(schema)) {
        injector.inject(injectTo, schema, pointer, hostPointer);
      }
    }
  }

  static preprocessProperties(schema:any, pointer:string, opts: PropertyPreprocessOptions) {
    let requiredMap = {};
    if (schema.required) {
      schema.required.forEach(prop => requiredMap[prop] = true);
    }

    let props = schema.properties && Object.keys(schema.properties).map(propName => {
      let propertySchema = Object.assign({}, schema.properties[propName]);
      let propPointer = propertySchema._pointer ||
        JsonPointer.join(pointer, ['properties', propName]);
      propertySchema = SchemaHelper.preprocess(propertySchema, propPointer);
      propertySchema._name = propName;
      // stop endless discriminator recursion
      if (propertySchema._pointer === opts.childFor) {
        propertySchema._pointer = null;
      }
      propertySchema._required = !!requiredMap[propName];
      propertySchema.isDiscriminator = (schema.discriminator === propName
        || schema['x-extendedDiscriminator'] === propName);
      return propertySchema;
    });

    props = props || [];

    if (schema.additionalProperties && (typeof schema.additionalProperties === 'object')) {
      let propsSchema = SchemaHelper.preprocessAdditionalProperties(schema, pointer);
      propsSchema._additional = true;
      props.push(propsSchema);
    }

    // filter readOnly props for request schemas
    if (opts.skipReadOnly) {
      props = props.filter(prop => !prop.readOnly);
    }
    schema._properties = props;
  }

  static preprocessAdditionalProperties(schema:any, pointer:string) {
    var addProps = schema.additionalProperties;
    let ptr = addProps._pointer || JsonPointer.join(pointer, ['additionalProperties']);
    let res = SchemaHelper.preprocess(addProps, ptr);
    res._name = '<Additional Properties> *';
    return res;
  }

  static unwrapArray(schema, pointer) {
    var res = schema;
    if (schema && schema.type === 'array' && !Array.isArray(schema.items)) {
      let items = schema.items = schema.items || {};
      let ptr = items._pointer || JsonPointer.join(pointer, ['items']);
      res = Object.assign({}, items);
      res._isArray = true;
      res._pointer = ptr;
      res = SchemaHelper.unwrapArray(res, ptr);
    }
    return res;
  }

  static methodSummary(method) {
    return method.summary || method.operationId ||
      (method.description && method.description.substring(0, 50)) || '<no description>';
  }

  static detectType(schema) {
    if (schema.type) return schema.type;
    let keywords = Object.keys(keywordTypes);
    for (var i=0; i < keywords.length; i++) {
      let keyword = keywords[i];
      let type = keywordTypes[keyword];
      if (schema[keyword]) {
        return type;
      }
    }
  }

  static getTags(schema) {
    let tags = {};
    for (let tag of schema.tags || []) {
      tags[tag.name] = tag;
      tag.methods = [];
    }

    let paths = schema.paths;
    for (let path of Object.keys(paths)) {
      let methods = Object.keys(paths[path]).filter((k) => swaggerMethods.has(k));
      for (let method of methods) {
        let methodInfo = paths[path][method];
        let methodTags = methodInfo.tags;

        if (!(methodTags && methodTags.length)) {
          methodTags = [''];
        }
        let methodPointer = JsonPointer.compile([path, method]);
        for (let tagName of methodTags) {
          let tag = tags[tagName];
          if (!tag) {
            tag = {
              name: tagName,
            };
            tags[tagName] = tag;
          }
          if (tag['x-traitTag']) continue;
          if (!tag.methods) tag.methods = [];
          tag.methods.push(methodInfo);
          methodInfo._pointer = methodPointer;
        }
      }
    }

    return Object.keys(tags).map(k => tags[k]);
  }

  static buildMenuTree(schema):MenuItem[] {
    let tags = SchemaHelper.getTags(schema);

    let menu = [];

    // markdown menu items

    for (let header of (<Array<string>>(schema.info && schema.info['x-redoc-markdown-headers'] || []))) {
      let id = 'section/' + slugify(header);
      let item = {
        name: header,
        id: id
      }
      menu.push(item);
    }

    // tag menu items
    for (let tag of tags || []) {
      let id = 'tag/' + slugify(tag.name);
      let item:MenuItem;
      let items:MenuItem[];

      // don't put empty tag into menu, instead put all methods
      if (tag.name !== '') {
        item = {
          name: tag['x-displayName'] || tag.name,
          id: id,
          description: tag.description,
          metadata: { type: 'tag' }
        };
        if (tag.methods && tag.methods.length) {
          item.items = items = [];
        }
      } else {
        item = null;
        items = menu;
      }

      if (items) {
        for (let method of tag.methods) {
          let subItem = {
            name: SchemaHelper.methodSummary(method),
            id: method._pointer,
            description: method.description,
            metadata: {
              type: 'method',
              pointer: '/paths' + method._pointer,
              operationId: method.operationId
            },
            parent: item
          }
          items.push(subItem);
        }
      }

      if (item) menu.push(item);
    }
    return menu;
  }

  static flatMenu(menu: MenuItem[]):MenuItem[] {
    let res = [];
    let level = 0;

    let recursive = function(items) {
      for (let item of items) {
        res.push(item);
        item.level = item.level || level;
        item.flatIdx = res.length - 1;
        if (item.items) {
          level++;
          recursive(item.items);
          level--;
        }
      }
    }
    recursive(menu);
    return res;
  }
}
