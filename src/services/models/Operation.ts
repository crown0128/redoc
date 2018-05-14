import { action, observable } from 'mobx';
import { join as joinPaths } from 'path';
import { parse as urlParse } from 'url';

import { IMenuItem } from '../MenuStore';
import { GroupModel } from './Group.model';
import { SecurityRequirementModel } from './SecurityRequirement';

import { OpenAPIExternalDocumentation, OpenAPIServer } from '../../types';

import {
  getOperationSummary,
  isAbsolutePath,
  JsonPointer,
  mergeParams,
  sortByRequired,
  stripTrailingSlash,
} from '../../utils';
import { ContentItemModel, ExtendedOpenAPIOperation } from '../MenuBuilder';
import { OpenAPIParser } from '../OpenAPIParser';
import { RedocNormalizedOptions } from '../RedocNormalizedOptions';
import { FieldModel } from './Field';
import { RequestBodyModel } from './RequestBody';
import { ResponseModel } from './Response';
import { CodeSample } from './types';

/**
 * Operation model ready to be used by components
 */
export class OperationModel implements IMenuItem {
  //#region IMenuItem fields
  id: string;
  absoluteIdx?: number;
  name: string;
  description?: string;
  type = 'operation' as 'operation';

  parent?: GroupModel;
  externalDocs?: OpenAPIExternalDocumentation;
  items: ContentItemModel[] = [];

  depth: number;

  @observable ready?: boolean = true;
  @observable active: boolean = false;
  //#endregion

  _$ref: string;
  operationId?: string;
  httpVerb: string;
  deprecated: boolean;
  requestBody?: RequestBodyModel;
  parameters: FieldModel[];
  responses: ResponseModel[];
  path: string;
  servers: OpenAPIServer[];
  security: SecurityRequirementModel[];
  codeSamples: CodeSample[];

  constructor(
    parser: OpenAPIParser,
    operationSpec: ExtendedOpenAPIOperation,
    parent: GroupModel | undefined,
    options: RedocNormalizedOptions,
  ) {
    this.id =
      operationSpec.operationId !== undefined
        ? 'operation/' + operationSpec.operationId
        : this.parent !== undefined
          ? this.parent.id + operationSpec._$ref
          : operationSpec._$ref;

    this.name = getOperationSummary(operationSpec);
    this.description = operationSpec.description;

    this.parent = parent;
    this.externalDocs = operationSpec.externalDocs;

    this._$ref = operationSpec._$ref;
    this.deprecated = !!operationSpec.deprecated;
    this.httpVerb = operationSpec.httpVerb;
    this.deprecated = !!operationSpec.deprecated;
    this.operationId = operationSpec.operationId;
    this.requestBody =
      operationSpec.requestBody && new RequestBodyModel(parser, operationSpec.requestBody, options);
    this.codeSamples = operationSpec['x-code-samples'] || [];
    this.path = JsonPointer.baseName(this._$ref, 2);

    this.parameters = mergeParams(
      parser,
      operationSpec.pathParameters,
      operationSpec.parameters,
    ).map(paramOrRef => new FieldModel(parser, paramOrRef, this._$ref, options));

    if (options.requiredPropsFirst) {
      sortByRequired(this.parameters);
    }

    let hasSuccessResponses = false;
    this.responses = Object.keys(operationSpec.responses || [])
      .filter(code => {
        if (parseInt(code, 10) >= 100 && parseInt(code, 10) <= 399) {
          hasSuccessResponses = true;
        }
        return isNumeric(code) || code === 'default';
      }) // filter out other props (e.g. x-props)
      .map(code => {
        return new ResponseModel(
          parser,
          code,
          hasSuccessResponses,
          operationSpec.responses[code],
          options,
        );
      });

    this.servers = normalizeServers(
      parser.specUrl,
      operationSpec.servers || parser.spec.servers || [],
    );

    this.security = (operationSpec.security || parser.spec.security || []).map(
      security => new SecurityRequirementModel(security, parser),
    );
  }

  /**
   * set operation as active (used by side menu)
   */
  @action
  activate() {
    this.active = true;
  }

  /**
   * set operation as inactive (used by side menu)
   */
  @action
  deactivate() {
    this.active = false;
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function normalizeServers(specUrl: string, servers: OpenAPIServer[]): OpenAPIServer[] {
  if (servers.length === 0) {
    return [
      {
        url: specUrl,
      },
    ];
  }

  function normalizeUrl(url: string): string {
    url = isAbsolutePath(url) ? url : joinPaths(specUrl, url);
    return stripTrailingSlash(url.startsWith('//') ? `${specProtocol}${url}` : url);
  }

  const { protocol: specProtocol } = urlParse(specUrl);

  return servers.map(server => {
    return {
      ...server,
      url: normalizeUrl(server.url),
      description: server.description || '',
    };
  });
}
