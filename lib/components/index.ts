'use strict';

import { ApiInfo } from './ApiInfo/api-info';
import { ApiLogo } from './ApiLogo/api-logo';
import { JsonSchema } from './JsonSchema/json-schema';
import { JsonSchemaLazy } from './JsonSchema/json-schema-lazy';
import { ParamsList } from './ParamsList/params-list';
import { RequestSamples } from './RequestSamples/request-samples';
import { ResponsesList } from './ResponsesList/responses-list';
import { ResponsesSamples } from './ResponsesSamples/responses-samples';
import { SchemaSample } from './SchemaSample/schema-sample';
import { SideMenu, SideMenuItems } from './SideMenu/side-menu';
import { OperationsList } from './OperationsList/operations-list';
import { Operation } from './Operation/operation';
import { Warnings } from './Warnings/warnings';
import { SecurityDefinitions } from './SecurityDefinitions/security-definitions';
import { LoadingBar } from './LoadingBar/loading-bar';
import { RedocSearch } from './Search/redoc-search';
import { ExternalDocs } from './ExternalDocs/external-docs';
import { EndpointLink } from './EndpointLink/endpoint-link';

import { Redoc } from './Redoc/redoc';

export const REDOC_DIRECTIVES = [
  ApiInfo, ApiLogo, JsonSchema, JsonSchemaLazy, ParamsList, RequestSamples, ResponsesList,
  ResponsesSamples, SchemaSample, SideMenu, OperationsList, Operation, Warnings, Redoc, SecurityDefinitions,
  LoadingBar, SideMenuItems, RedocSearch, ExternalDocs, EndpointLink
];

export { ApiInfo, ApiLogo, JsonSchema, JsonSchemaLazy, ParamsList, RequestSamples, ResponsesList,
ResponsesSamples, SchemaSample, SideMenu, OperationsList, Operation, Warnings, Redoc, SecurityDefinitions,
LoadingBar, SideMenuItems, ExternalDocs, EndpointLink };
