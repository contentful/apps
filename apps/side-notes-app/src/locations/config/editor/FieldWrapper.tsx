import React, { ReactNode, useContext } from 'react';
import { WidgetEditorContext } from './WidgetEditorContext';
import { Flex, Text } from '@contentful/f36-components';
import styled from 'styled-components';
import tokens from '@contentful/f36-tokens';

const FieldContainer = styled.div`
  padding: ${tokens.spacingS};
  background-color: ${tokens.colorWhite};
`;

const MimicField = styled.div`
  padding: 0px ${tokens.spacingS};
  border-left: 3px solid ${tokens.gray300};
  display: flex;
  flex-direction: column;
`;

export const FieldWrapper = ({ children }: { children: ReactNode }) => {
  const { selectedField } = useContext(WidgetEditorContext);

  return (
    <Flex flexDirection="column">
      <FieldContainer>
        <MimicField>
          <Text marginBottom="spacingM" fontColor="gray600">
            {selectedField?.name}
          </Text>
          {children}
        </MimicField>
      </FieldContainer>
    </Flex>
  );
};
