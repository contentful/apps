import { Button, Card, Flex, Grid, Heading, Note, Text } from '@contentful/f36-components';
import { ArrowBackwardIcon } from '@contentful/f36-icons';
import { useContext, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { DragEditor } from './DragEditor';

import { DISABLED_FIELD_TYPES } from '../constants';
import { AddWidgetCta } from './AddWidgetCta';
import { EditorPlaceholder } from './EditorPlaceholder';
import { WidgetEditorContext } from './WidgetEditorContext';
import { LocationSelector } from './locationSelector/LocationSelector';
import { WidgetSidebar } from './sidebar/WidgetSidebar';
import { EditorGrid, EditorSection } from './styles';

export const WidgetEditor = () => {
  const navigate = useNavigate();

  const {
    setElements,
    selectedField,
    selectedFieldDef,
    selectedContentTypeDef,
    selectedContentType,
    location,
    isEmpty,
  } = useContext(WidgetEditorContext);

  useEffect(() => {
    if (location === 'Sidebar' && selectedContentTypeDef.sidebar?.widgets) {
      setElements(selectedContentTypeDef.sidebar?.widgets);
    }
    if (location === 'Field' && selectedFieldDef?.widgets) {
      setElements(selectedFieldDef?.widgets);
    }
  }, [location]);

  const isDisabled = useMemo(() => {
    if (location === 'Sidebar') return false;
    return !selectedField || DISABLED_FIELD_TYPES.includes(selectedField.type);
  }, [selectedField]);

  return (
    <Flex flexDirection="column" gap="spacingL" fullHeight fullWidth>
      <div>
        <Button variant="transparent" onClick={() => navigate('/')}>
          <Flex gap="spacingXs" alignItems="center">
            <ArrowBackwardIcon variant="secondary" />
            <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
              Back To List
            </Text>
          </Flex>
        </Button>
      </div>
      <Heading>{selectedContentType?.name}</Heading>
      <EditorGrid columns="2fr 4fr 2fr">
        <Grid.Item>
          <EditorSection>
            <LocationSelector />
          </EditorSection>
        </Grid.Item>
        <Grid.Item>
          <EditorSection>{!isEmpty ? <DragEditor /> : <EditorPlaceholder />}</EditorSection>
        </Grid.Item>
        <Grid.Item>
          <Flex flexDirection="column" gap="spacingM">
            <AddWidgetCta isDisabled={isDisabled} />
            {isDisabled && (
              <Flex>
                <Note variant="warning">
                  This field type is currently not supported by the Side Notes App. We are working
                  on a solution to add widgets to this field type as well.
                </Note>
              </Flex>
            )}
            <Card>
              <WidgetSidebar />
            </Card>
            <Note title="Note:">
              <Flex flexDirection="column" gap="spacingM">
                <span>
                  Tip: You can access values from the entry inside the content of the widget. To
                  resolve a value use a JSON pointer wrapped with curly braces.
                </span>
                <span>Example:</span>
                <span>
                  "<code>{'{ /entry/fields/test/value }'}</code>"
                </span>
              </Flex>
            </Note>
          </Flex>
        </Grid.Item>
      </EditorGrid>
    </Flex>
  );
};
