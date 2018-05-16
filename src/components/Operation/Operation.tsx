import * as React from 'react';
import styled from '../../styled-components';
import { SecurityRequirements } from '../SecurityRequirement/SecuirityRequirement';

import { observer } from 'mobx-react';

import { Badge, DarkRightPanel, H2, MiddlePanel, Row } from '../../common-elements';

import { OptionsContext } from '../OptionsProvider';

import { ShareLink } from '../../common-elements/linkify';
import { Endpoint } from '../Endpoint/Endpoint';
import { Markdown } from '../Markdown/Markdown';
import { Parameters } from '../Parameters/Parameters';
import { RequestSamples } from '../RequestSamples/RequestSamples';
import { ResponsesList } from '../Responses/ResponsesList';
import { ResponseSamples } from '../ResponseSamples/ResponseSamples';

import { OperationModel as OperationType } from '../../services/models';

const OperationRow = Row.extend`
  backface-visibility: hidden;
  contain: content;

  overflow: hidden;
  position: relative;

  &:after {
    position: absolute;
    bottom: 0;
    width: 100%;
    display: block;
    content: '';
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }
`;

export interface OperationProps {
  operation: OperationType;
}

@observer
export class Operation extends React.Component<OperationProps> {
  render() {
    const { operation } = this.props;

    const { name: summary, description, deprecated } = operation;
    return (
      <OptionsContext.Consumer>
        {options => (
          <OperationRow>
            <MiddlePanel>
              <H2>
                <ShareLink href={'#' + operation.id} />
                {summary} {deprecated && <Badge type="warning"> Deprecated </Badge>}
              </H2>
              {options.pathInMiddlePanel && <Endpoint operation={operation} inverted={true} />}
              {description !== undefined && <Markdown source={description} />}
              <SecurityRequirements securities={operation.security} />
              <Parameters parameters={operation.parameters} body={operation.requestBody} />
              <ResponsesList responses={operation.responses} />
            </MiddlePanel>
            <DarkRightPanel>
              {!options.pathInMiddlePanel && <Endpoint operation={operation} />}
              <RequestSamples operation={operation} />
              <ResponseSamples operation={operation} />
            </DarkRightPanel>
          </OperationRow>
        )}
      </OptionsContext.Consumer>
    );
  }
}
