import * as React from 'react';
import styled from '../../styled-components';
import { highlight } from '../../utils';

import { SampleControls, SampleControlsWrap } from '../../common-elements';
import { CopyButtonWrapper } from '../../common-elements/CopyButtonWrapper';

const StyledPre = styled.pre`
  font-family: ${props => props.theme.code.fontFamily};
  font-size: ${props => props.theme.code.fontSize};
  overflow-x: auto;
  margin: 0;

  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

export interface SourceCodeProps {
  source: string;
  lang: string;
}

export class SourceCode extends React.PureComponent<SourceCodeProps> {
  render() {
    const { source, lang } = this.props;
    return <StyledPre dangerouslySetInnerHTML={{ __html: highlight(source, lang) }} />;
  }
}

export class SourceCodeWithCopy extends React.PureComponent<SourceCodeProps> {
  render() {
    return (
      <CopyButtonWrapper data={this.props.source}>
        {({ renderCopyButton }) => (
          <SampleControlsWrap>
            <SampleControls>{renderCopyButton()}</SampleControls>
            <SourceCode lang={this.props.lang} source={this.props.source} />
          </SampleControlsWrap>
        )}
      </CopyButtonWrapper>
    );
  }
}
