import { hoverColor } from '../../common-elements/mixins';
import styled from '../../styled-components';
export { ClassAttributes } from 'react';

export const RedocWrap = styled.div`
  font-family: ${props => props.theme.baseFont.family};
  font-size: ${props => props.theme.baseFont.size};
  line-height: ${props => props.theme.baseFont.lineHeight};
  color: ${props => props.theme.colors.text};
  display: flex;
  position: relative;

  -webkit-font-smoothing: ${props => props.theme.baseFont.smoothing};
  font-smoothing: ${props => props.theme.baseFont.smoothing};
  ${props =>
    (props.theme.baseFont.optimizeSpeed && 'text-rendering: optimizeSpeed !important') || ''};

  tap-highlight-color: rgba(0, 0, 0, 0);
  text-size-adjust: 100%;

  * {
    box-sizing: border-box;
  }

  .redoc-markdown h1 {
    padding-top: ${props => props.theme.spacingUnit * 4}px;
  }

  a {
    text-decoration: none;
    color: ${props => props.theme.links.color || props.theme.colors.main};
    ${props => hoverColor(props.theme.links.hover)};
  }
`;

export const StickySidebar = styled.div`
  min-width: ${props => props.theme.menu.width};
  background-color: ${props => props.theme.menu.backgroundColor};
  overflow: hidden;
  display: flex;
  flex-direction: column;

  transform: translateZ(0);

  max-height: 100vh;
  position: sticky;
  position: -webkit-sticky;
  top: 0;
`;

export const ApiContent = styled.div`
  z-index: 10;
  position: relative;
`;
