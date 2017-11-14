import * as React from 'react';
import { OperationModel } from '../../services';
import { ShelfIcon } from '../../common-elements';
import { SelectOnClick } from '../SelectOnClick/SelectOnClick';

import {
  OperationEndpointWrap,
  EndpointInfo,
  HttpVerb,
  ServerRelativeURL,
  ServersOverlay,
  ServerItem,
  ServerUrl,
} from './styled.elements';

export interface EndpointProps {
  operation: OperationModel;
}

export interface EndpointState {
  expanded: boolean;
}

export class Endpoint extends React.PureComponent<EndpointProps, EndpointState> {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    };
  }

  toggle = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    const { operation } = this.props;
    const { expanded } = this.state;

    // TODO: highlight server variables, e.g. https://{user}.test.com
    return (
      <OperationEndpointWrap>
        <EndpointInfo onClick={this.toggle} expanded={expanded}>
          <HttpVerb type={operation.httpVerb}> {operation.httpVerb}</HttpVerb>{' '}
          <ServerRelativeURL>{operation.path}</ServerRelativeURL>
          <ShelfIcon
            float={'right'}
            color={'white'}
            size={'20px'}
            direction={expanded ? 'up' : 'down'}
            style={{ marginRight: '-25px' }}
          />
        </EndpointInfo>
        <ServersOverlay expanded={expanded}>
          {operation.servers.map(server => (
            <ServerItem key={server.url}>
              <div>{server.description}</div>
              <SelectOnClick>
                <ServerUrl>
                  <span>{server.url}</span>
                  {operation.path}
                </ServerUrl>
              </SelectOnClick>
            </ServerItem>
          ))}
        </ServersOverlay>
      </OperationEndpointWrap>
    );
  }
}
