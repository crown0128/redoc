import { observer } from 'mobx-react';
import * as React from 'react';

import { MediaContentModel, OperationModel } from '../../services/models';

import { Tab, TabList, TabPanel, Tabs } from '../../common-elements';
import { PayloadSamples } from '../PayloadSamples/PayloadSamples';

export interface ResponseSampleProps {
  content: MediaContentModel;
}

class ResponseSample extends React.Component<ResponseSampleProps, any> {
  render() {
    return <PayloadSamples content={this.props.content} />;
  }
}

export interface ResponseSamplesProps {
  operation: OperationModel;
}

@observer
export class ResponseSamples extends React.Component<ResponseSamplesProps> {
  operation: OperationModel;

  visited = new Set();

  render() {
    const { operation } = this.props;
    const responses = operation.responses.filter(response => {
      return response.content && response.content.hasSample;
    });

    return (
      (responses.length > 0 && (
        <div>
          <h3> Response samples </h3>

          <Tabs defaultIndex={0}>
            <TabList>
              {responses.map(response => (
                <Tab className={'tab-' + response.type} key={response.code}>
                  {response.code}
                </Tab>
              ))}
            </TabList>
            {responses.map(response => (
              <TabPanel key={response.code}>
                <ResponseSample content={response.content!} />
              </TabPanel>
            ))}
          </Tabs>
        </div>
      )) ||
      null
    );
  }
}
