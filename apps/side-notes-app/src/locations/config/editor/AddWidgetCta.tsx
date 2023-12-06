import React, { useContext } from 'react';
import { Button, Menu } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import { WidgetLocationEvent } from '../../../analytics';
import {
  AnalyticsContentTypeAssignmentWidgetLocation,
  WidgetLocationEventAction,
  WidgetTemplate,
} from '../../../types';
import { getPossibleWidgets, NATIVE_FIELD_EDITOR_WIDGET } from '../constants';
import { WidgetEditorContext } from './WidgetEditorContext';

export const AddWidgetCta = ({ isDisabled }: { isDisabled: boolean }) => {
  const { setElements, setSelectedElement, location, isEmpty, editorInterface, selectedFieldDef } =
    useContext(WidgetEditorContext);

  const addNewWidgetElement = (item: WidgetTemplate) => {
    const newItem = { ...item, key: window.crypto.randomUUID() };
    const newItems = [newItem];
    if (isEmpty && location === 'Field') {
      const fieldControl = editorInterface?.controls?.find(
        (control) => control.fieldId === selectedFieldDef?.id
      );

      newItems.unshift({
        ...NATIVE_FIELD_EDITOR_WIDGET,
        key: Math.random().toString(),
      });
      setElements(newItems, fieldControl && fieldControl.widgetId ? fieldControl : undefined);
    } else {
      setElements((prevElements) => [...prevElements, newItem]);
    }

    setSelectedElement(newItem.key);
  };

  const possibleWidgets = getPossibleWidgets(location);
  return (
    <Menu>
      <Menu.Trigger>
        <Button isDisabled={isDisabled} size="large" endIcon={<PlusIcon />} variant="positive">
          Add Element
        </Button>
      </Menu.Trigger>
      <Menu.List>
        {possibleWidgets?.map((item) => (
          <Menu.Item
            key={item.type}
            onClick={() => {
              WidgetLocationEvent(
                WidgetLocationEventAction.NEW_WIDGET_ADDED,
                location === 'Field'
                  ? AnalyticsContentTypeAssignmentWidgetLocation.FIELD
                  : AnalyticsContentTypeAssignmentWidgetLocation.SIDEBAR,
                item.type
              );
              addNewWidgetElement(item);
            }}>
            {item.name}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
};
