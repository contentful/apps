import { Button, Flex, Paragraph } from '@contentful/f36-components';
import { ContentFields, KeyValueMap } from 'contentful-management';
import { useContext } from 'react';
import styled from 'styled-components';
import { NativeFieldEditorRender } from '../../../components/NativeFieldEditorRender';
import { WidgetElementDefinition } from '../../../types';
import { POSSIBLE_BASE_WIDGETS } from '../constants';
import { createMockFieldExtensionSDK } from '../sdkMock';
import { EditorContent } from './DragEditor';
import { FieldWrapper } from './FieldWrapper';
import { SidebarWrapper } from './SidebarWrapper';
import { WidgetEditorContext } from './WidgetEditorContext';

const SidebarPlaceholder = styled(Flex)`
  height: 240px;
  background: white;
  border-radius: 6px;
`;

export function EditorPlaceholder() {
  const { setElements, location, selectedContentTypeDef, selectedField } =
    useContext(WidgetEditorContext);

  if (location === 'Field') {
    if (!selectedField) return null;
    const mockFieldExtensionSdk = createMockFieldExtensionSDK({
      ref: selectedField,
    });
    return (
      <EditorContent>
        <FieldWrapper>
          <NativeFieldEditorRender
            mockSdk={mockFieldExtensionSdk}
            contentTypeId={selectedContentTypeDef.id}
          />
        </FieldWrapper>
      </EditorContent>
    );
  }

  const createSidebarWidgets = () => {
    const starterElements: WidgetElementDefinition[] = [
      {
        ...POSSIBLE_BASE_WIDGETS[1],
        key: Math.random().toString(),
        content: 'Example widgets',
      },
      {
        ...POSSIBLE_BASE_WIDGETS[3],
        key: Math.random().toString(),
        content:
          'These widgets are just examples, feel free to drag and drop to change the order or add and remove widgets to add additional information to the entry',
      },
    ];
    setElements(starterElements);
  };

  return (
    <SidebarWrapper>
      <SidebarPlaceholder flexDirection="column" alignItems="center" justifyContent="center">
        <Paragraph>No widgets are defined for the sidebar.</Paragraph>
        <Button onClick={createSidebarWidgets} variant="primary">
          Add {location} Widgets
        </Button>
      </SidebarPlaceholder>
    </SidebarWrapper>
  );
}
