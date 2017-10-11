import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { ParametersGroup } from './ParametersGroup';
import * as React from 'react';

import { UnderlinedHeader } from '../../common-elements';

import { Schema } from '../Schema';
import { MediaTypesSwitch } from '../MediaTypeSwitch/MediaTypesSwitch';
import { FieldModel, RequestBodyModel } from '../../services/models';

import { MediaContentModel } from '../../services';

function safePush(obj, prop, item) {
  if (!obj[prop]) obj[prop] = [];
  obj[prop].push(item);
}

interface ParametersProps {
  parameters?: FieldModel[];
  body?: RequestBodyModel;
}

const PARAM_PLACES = ['path', 'query', 'cookie', 'header'];

export class Parameters extends React.PureComponent<ParametersProps> {
  orderParams(params: FieldModel[]): Dict<FieldModel[]> {
    let res = {};
    params.forEach(param => {
      safePush(res, param.in, param);
    });
    return res;
  }

  render() {
    const { body, parameters = [] } = this.props;
    if (body === undefined && parameters === undefined) {
      return null;
    }

    let paramsMap = this.orderParams(parameters);

    const paramsPlaces = parameters.length > 0 ? PARAM_PLACES : [];

    const bodyContent = body && body.content;

    return (
      <div>
        {paramsPlaces.map(place => (
          <ParametersGroup key={place} place={place} parameters={paramsMap[place]} />
        ))}
        {bodyContent && <BodyContent content={bodyContent} />}
      </div>
    );
  }
}

function BodyContent(props: { content: MediaContentModel }): JSX.Element {
  const { content } = props;
  return (
    <MediaTypesSwitch
      content={content}
      renderDropdown={props => (
        <UnderlinedHeader key="header">
          Request Body schema: <DropdownOrLabel {...props} />
        </UnderlinedHeader>
      )}
    >
      {({ schema }) => {
        return <Schema key="schema" schema={schema} />;
      }}
    </MediaTypesSwitch>
  );
}
