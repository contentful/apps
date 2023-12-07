import styled from 'styled-components';
import tokens from '@contentful/f36-tokens';
import { Flex, Grid, IconButton } from '@contentful/f36-components';

export const EditorSection = styled.div`
  height: 100%;
  background: white;
  padding: ${tokens.spacingM};
  border-radius: 8px;
`;

export const EditorGrid = styled(Grid)`
  height: 100%;
`;

export const DragSection = styled.div`
  padding: ${tokens.spacingXs};
  border: 1px solid white;
  border-radius: 6px;
  min-width: 50%;
  width: 100%;
`;

export const DragIndicator = styled.div`
  background: white;
  position: absolute;
  left: -24px;
  padding: 8px 4px;
`;

export const DeleteButton = styled(IconButton)`
  position: absolute;
  right: -28px;
  padding: 4px;
`;

export const DragWidgetTitle = styled.div`
  position: absolute;
  right: 48px;
  top: -8px;
  font-size: ${tokens.fontSizeS};
  background: white;
  padding: 4px 12px;
  z-index: 99;
  border-radius: 2px;
`;

export const DragElementContainer = styled(Flex)`
  min-height: ${tokens.spacingL};
  position: relative;
  [data-highlight='true'] {
    visibility: hidden;
  }
  &[data-selected='true'],
  &:hover {
    ${DragSection} {
      border: 1px solid black;
    }
    [data-highlight='true'] {
      visibility: visible;
    }
  }
`;
