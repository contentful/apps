import { DeleteIcon, DragIcon } from '@contentful/f36-icons';
import { useContext } from 'react';
import { WidgetRenderer } from '../../../components/WidgetRenderer';

import { WidgetType } from '../../../types';
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
  const { setElements, selectedContentTypeDef } = useContext(WidgetEditorContext);

  const removeWidgetElement = () => {
    setElements((prevElements) => prevElements.filter((el) => el.key !== widgetDef.key));
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
