import { transparentize } from 'polished';
import { ClassAttributes, HTMLAttributes } from 'react';

import { UnderlinedHeader } from '../../common-elements';
import styled, { ResolvedThemeInterface, StyledComponentClass } from '../../styled-components';
import { ResponseTitle, ResponseTitleProps } from './ResponseTitle';

export const StyledResponseTitle = styled(ResponseTitle)`
  padding: 10px;
  border-radius: 2px;
  margin-bottom: 4px;
  line-height: 1.5em;
  background-color: #f2f2f2;
  cursor: pointer;

  color: ${props => props.theme.colors[props.type]};
  background-color: ${props => transparentize(0.92, props.theme.colors[props.type])};

  ${props =>
    (props.empty &&
      `
cursor: default;
&::before {
  content: "—";
  font-weight: bold;
  width: 1.5em;
  text-align: center;
  display: inline-block;
}
`) ||
    ''};
`;

export const ResponseDetailsWrap = styled.div`
  padding: 10px;
`;

export const HeadersCaption = UnderlinedHeader.withComponent('caption').extend`
  text-align: left;
  margin-top: 1em;
`;
