import * as Sampler from 'openapi-sampler';

import { OpenAPIExample, OpenAPIMediaType } from '../../types';
import { SchemaModel } from './Schema';

import { mapValues, isJsonLike } from '../../utils';
import { OpenAPIParser } from '../OpenAPIParser';
import { ExampleModel } from './Example';

export class MediaTypeModel {
  examples?: { [name: string]: OpenAPIExample };
  schema?: SchemaModel;
  name: string;
  isRequestType: boolean;

  /**
   * @param isRequestType needed to know if skipe RO/RW fields in objects
   */
  constructor(parser: OpenAPIParser, name: string, isRequestType: boolean, info: OpenAPIMediaType) {
    this.name = name;
    this.isRequestType = isRequestType;
    this.schema = info.schema && new SchemaModel(parser, info.schema, '');
    if (info.examples !== undefined) {
      this.examples = mapValues(info.examples, example => new ExampleModel(parser, example));
    } else if (info.example !== undefined) {
      this.examples = {
        default: new ExampleModel(parser, { value: info.example }),
      };
    } else if (isJsonLike(name)) {
      this.generateExample(parser, info);
    }
  }

  generateExample(parser: OpenAPIParser, info: OpenAPIMediaType) {
    const { schema, isRequestType } = this;
    if (schema && schema.oneOf) {
      this.examples = {};
      for (let subSchema of schema.oneOf) {
        this.examples[subSchema.title] = {
          value: Sampler.sample(
            subSchema.rawSchema,
            { skipReadOnly: isRequestType, skipReadWrite: !isRequestType },
            parser.spec,
          ),
        };
      }
    } else {
      this.examples = {
        default: new ExampleModel(parser, {
          value: Sampler.sample(
            info.schema,
            { skipReadOnly: isRequestType, skipReadWrite: !isRequestType },
            parser.spec,
          ),
        }),
      };
    }
  }
}
