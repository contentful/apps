import { DeleteIcon, DragIcon } from '@contentful/f36-icons';
import { useContext } from 'react';
import { WidgetLocationEvent } from '../../../analytics';
import { WidgetRenderer } from '../../../components/WidgetRenderer';

import {
  WidgetType,
  WidgetLocationEventAction,
  AnalyticsContentTypeAssignmentWidgetLocation,
} from '../../../types';
import { WidgetElementDefinition } from '../../../types/types';
import {
  DeleteButton,
  DragElementContainer,
  DragIndicator,
  DragSection,
  DragWidgetTitle,
} from './styles';
import { WidgetEditorContext } from './WidgetEditorContext';

export const DragElement = ({
  widgetDef,
  isSelected,
}: {
  widgetDef: WidgetElementDefinition;
  isSelected: boolean;
}) => {
  const { setElements, location, selectedContentTypeDef } = useContext(WidgetEditorContext);

  const removeWidgetElement = () => {
    setElements((prevElements) => prevElements.filter((el) => el.key !== widgetDef.key));
    WidgetLocationEvent(
      WidgetLocationEventAction.WIDGET_DELETED,
      location === 'Field'
        ? AnalyticsContentTypeAssignmentWidgetLocation.FIELD
        : AnalyticsContentTypeAssignmentWidgetLocation.SIDEBAR
    );
  };
  return (
    <DragElementContainer
      gap="spacingS"
      alignItems="center"
      data-selected={isSelected ? 'true' : 'false'}>
      <DragIndicator data-highlight="true">
        <DragIcon />
      </DragIndicator>
      <DragWidgetTitle data-highlight="true">{widgetDef.type}</DragWidgetTitle>
      <DragSection>
        <WidgetRenderer contentTypeId={selectedContentTypeDef.id} widgetDef={widgetDef} />
      </DragSection>
      {widgetDef.type !== WidgetType.NativeFieldEditor && (
        <DeleteButton
          data-highlight="true"
          variant="secondary"
          aria-label="Select the date"
          onClick={removeWidgetElement}
          icon={<DeleteIcon />}
        />
      )}
    </DragElementContainer>
  );
};
