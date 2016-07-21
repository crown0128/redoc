'use strict';
import { JsonPointer } from '../utils/JsonPointer';
import { SpecManager } from '../utils/SpecManager';
import {methods as swaggerMethods} from  '../utils/swagger-defs';

interface PropertyPreprocessOptions {
  childFor: string;
  skipReadOnly?: boolean;
}

export interface MenuMethod {
  active: boolean;
  summary: string;
  tag: string;
}

export interface MenuCategory {
  name: string;

  active?: boolean;
  methods?: Array<MenuMethod>;
  description?: string;
  empty?: string;
  virtual?: boolean;
}

const injectors = {
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
      }
    }
  },
  discriminator: {
    check: (propertySchema) => propertySchema.discriminator,
    inject: (injectTo, propertySchema = injectTo, pointer) => {
      injectTo._descendants = SpecManager.instance().findDerivedDefinitions(pointer);
      injectTo.discriminator = propertySchema.discriminator;
    }
  },
  array: {
    check: (propertySchema) => {
      return propertySchema.type === 'array';
    },
    inject: (injectTo, propertySchema = injectTo, propPointer) => {
      injectTo._isArray = true;
      injectTo._pointer = propertySchema.items._pointer
        || JsonPointer.join(propertySchema._pointer || propPointer, ['items']);

      SchemaHelper.runInjectors(injectTo, propertySchema.items, propPointer);
    }
  },
  object: {
    check: (propertySchema) => {
      return propertySchema.type === 'object' && propertySchema.properties;
    },
    inject: (injectTo, propertySchema = injectTo) => {
      let baseName = propertySchema._pointer && JsonPointer.baseName(propertySchema._pointer);
      injectTo._displayType = propertySchema.title || baseName || 'object';
    }
  },
  noType: {
    check: (propertySchema) => !propertySchema.type,
    inject: (injectTo) => {
      injectTo._displayType = '< * >';
      injectTo._displayTypeHint = 'This field may contain data of any type';
      injectTo.isTrivial = true;
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
    }
  },
  integer: {
    check: (propertySchema) => (propertySchema.type === 'integer' || propertySchema.type === 'number'),
    inject: (injectTo, propertySchema = injectTo) => {
      var range = '';
      if (propertySchema.minimum && propertySchema.maximum) {
        range += propertySchema.exclusiveMinimum ? '( ' : '[ ';
        range += propertySchema.minimum;
        range += ' .. ';
        range += propertySchema.maximum;
        range += propertySchema.exclusiveMaximum ? ' )' : ' ]';
      } else if (propertySchema.maximum) {
        range += propertySchema.exclusiveMaximum? '< ' : '<= ';
        range += propertySchema.maximum;
      } else if (propertySchema.minimum) {
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
      if (propertySchema.minLength && propertySchema.maxLength) {
        range = `[ ${propertySchema.minLength} .. ${propertySchema.maxLength} ]`;
      } else if (propertySchema.maxLength) {
        range = '<= ' + propertySchema.maxLength;
      } else if (propertySchema.minimum) {
        range = '>= ' + propertySchema.minLength;
      }

      if (range) {
        injectTo._range = range + ' characters';
      }
    }
  },
  file: {
    check: propertySchema => (propertySchema.type === 'file'),
    inject: (injectTo, propertySchema = injectTo, propPointer, hostPointer) => {
      injectTo.isFile = true;
      let parentPtr;
      if (propertySchema.in === 'formData') {
        parentPtr = JsonPointer.dirName(hostPointer, 1);
      } else {
        parentPtr = JsonPointer.dirName(hostPointer, 3);
      }

      let parentParam = SpecManager.instance().byPointer(parentPtr);
      let root = SpecManager.instance().schema;
      injectTo._produces = parentParam && parentParam.produces || root.produces;
      injectTo._consumes = parentParam && parentParam.consumes || root.consumes;

    }
  }
};

export class SchemaHelper {
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

    let discriminatorFieldIdx = -1;
    let props = schema.properties && Object.keys(schema.properties).map((propName, idx) => {
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
      propertySchema.isDiscriminator = (schema.discriminator === propName);
      if (propertySchema.isDiscriminator) {
        discriminatorFieldIdx = idx;
      }
      return propertySchema;
    });

    props = props || [];

    if (schema.additionalProperties && (typeof schema.additionalProperties === 'object')) {
      let propsSchema = SchemaHelper.preprocessAdditionalProperties(schema, pointer);
      propsSchema._additional = true;
      props.push(propsSchema);
    }

    // Move discriminator field to the end of properties list
    if (discriminatorFieldIdx > -1) {
      let discrProp = props.splice(discriminatorFieldIdx, 1);
      props.push(discrProp[0]);
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
    if (schema && schema.type === 'array') {
      let ptr = schema.items._pointer || JsonPointer.join(pointer, ['items']);
      res = schema.items;
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

  static buildMenuTree(schema):Array<MenuCategory> {
    let tag2MethodMapping = {};

    for (let header of (<Array<string>>(schema.info && schema.info['x-redoc-markdown-headers'] || []))) {
      tag2MethodMapping[header] = {
        name: header, virtual: true, methods: []
      };
    }

    for (let tag of schema.tags || []) {
      tag2MethodMapping[tag.name] = {
        name: tag.name,
        description: tag.description,
        headless: tag.name === '',
        empty: !!tag['x-traitTag'],
        methods: [],
      };
    }

    let paths = schema.paths;
    for (let path of Object.keys(paths)) {
      let methods = Object.keys(paths[path]).filter((k) => swaggerMethods.has(k));
      for (let method of methods) {
        let methodInfo = paths[path][method];
        let tags = methodInfo.tags;

        if (!tags || !tags.length) {
          tags = [''];
        }
        let methodPointer = JsonPointer.compile(['paths', path, method]);
        let methodSummary = SchemaHelper.methodSummary(methodInfo);
        for (let tag of tags) {
          let tagDetails = tag2MethodMapping[tag];
          if (!tag2MethodMapping[tag]) {
            tagDetails = {
              name: tag,
              headless: tag === ''
            };
            tag2MethodMapping[tag] = tagDetails;
          }
          if (tagDetails.empty) continue;
          if (!tagDetails.methods) tagDetails.methods = [];
          tagDetails.methods.push({
            pointer: methodPointer,
            summary: methodSummary,
            operationId: methodInfo.operationId,
            tag: tag
          });
        }
      }
    }
    return Object.keys(tag2MethodMapping).map(tag => tag2MethodMapping[tag]);
  }
}
