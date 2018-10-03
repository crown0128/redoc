import * as React from 'react';

import {
  NullableLabel,
  PatternLabel,
  RecursiveLabel,
  TypeFormat,
  TypeName,
  TypePrefix,
  TypeTitle,
} from '../../common-elements/fields';
import { ExternalDocumentation } from '../ExternalDocumentation/ExternalDocumentation';
import { Markdown } from '../Markdown/Markdown';
import { EnumValues } from './EnumValues';
import { Extensions } from './Extensions';
import { FieldProps } from './Field';
import { ConstraintsView } from './FieldContstraints';
import { FieldDetail } from './FieldDetail';

import { Badge } from '../../common-elements/';

export class FieldDetails extends React.PureComponent<FieldProps> {
  render() {
    const { showExamples, field, renderDiscriminatorSwitch } = this.props;

    const { schema, description, example, deprecated } = field;

    return (
      <div>
        <div>
          <TypePrefix>{schema.typePrefix}</TypePrefix>
          <TypeName>{schema.displayType}</TypeName>
          {schema.displayFormat && (
            <TypeFormat>
              {' '}
              &lt;
              {schema.displayFormat}
              &gt;{' '}
            </TypeFormat>
          )}
          {schema.title && <TypeTitle> ({schema.title}) </TypeTitle>}
          <ConstraintsView constraints={schema.constraints} />
          {schema.nullable && <NullableLabel> Nullable </NullableLabel>}
          {schema.pattern && <PatternLabel>{schema.pattern}</PatternLabel>}
          {schema.isCircular && <RecursiveLabel> Recursive </RecursiveLabel>}
        </div>
        {deprecated && (
          <div>
            <Badge type="warning"> Deprecated </Badge>
          </div>
        )}
        <FieldDetail label={'Default:'} value={schema.default} />
        {!renderDiscriminatorSwitch && <EnumValues type={schema.type} values={schema.enum} />}{' '}
        {showExamples && <FieldDetail label={'Example:'} value={example} />}
        {<Extensions extensions={{ ...field.extensions, ...schema.extensions }} />}
        <div>
          <Markdown compact={true} source={description} />
        </div>
        {schema.externalDocs && (
          <ExternalDocumentation externalDocs={schema.externalDocs} compact={true} />
        )}
        {(renderDiscriminatorSwitch && renderDiscriminatorSwitch(this.props)) || null}
      </div>
    );
  }
}
