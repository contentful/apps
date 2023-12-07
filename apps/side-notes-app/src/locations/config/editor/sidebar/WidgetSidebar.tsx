import { Flex, FormControl, Paragraph, Subheading, Textarea } from '@contentful/f36-components';

import { useContext } from 'react';
import { SidebarRenderProp } from './SidebarRenderProp';

import { WidgetEditorContext } from '../WidgetEditorContext';
import { WidgetType } from '../../../../types';

export const WidgetSidebar = () => {
  const { selectedElementObj, setElementByKey } = useContext(WidgetEditorContext);

  if (!selectedElementObj) {
    return <div>No element selected</div>;
  }

  const setContent = (value: string) => {
    const newObj = { ...selectedElementObj, content: value };
    setElementByKey(selectedElementObj.key, newObj);
  };

  const setProp = (key: string, value: string) => {
    const propIndex = selectedElementObj.props.findIndex((prop) => prop.key === key);

    const propElement = { ...selectedElementObj.props[propIndex] };
    propElement.value = value;
    const propsCopy = [...selectedElementObj.props];
    propsCopy[propIndex] = propElement;
    const newObj = {
      ...selectedElementObj,
      props: propsCopy,
    };
    setElementByKey(selectedElementObj.key, newObj);
  };

  return (
    <Flex flexDirection="column">
      <Subheading>{selectedElementObj.type}</Subheading>
      <Flex flexDirection="column">
        {selectedElementObj.props.map((prop) => {
          return (
            <FormControl key={prop.key}>
              <FormControl.Label>{prop.label}</FormControl.Label>
              <SidebarRenderProp propDef={prop} setProp={setProp} />
            </FormControl>
          );
        })}
      </Flex>
      {selectedElementObj.type !== WidgetType.NativeFieldEditor ? (
        <FormControl>
          <FormControl.Label>Content</FormControl.Label>
          <Textarea
            value={selectedElementObj.content}
            onChange={(e) => setContent(e.target.value)}
          />
        </FormControl>
      ) : (
        <Paragraph>
          This is the native field editor. In this view it is disabled. When rendered in the entry
          it will be editable as usual.
        </Paragraph>
      )}
    </Flex>
  );
};
