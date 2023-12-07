import { Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useContext } from 'react';
import styled from 'styled-components';

import { DragDropContext, Draggable, DropResult, Droppable } from 'react-beautiful-dnd';

import { DragElement } from './DragElement';
import { FieldWrapper } from './FieldWrapper';
import { SidebarWrapper } from './SidebarWrapper';
import { WidgetEditorContext } from './WidgetEditorContext';

export const EditorContent = styled.div`
  padding: ${tokens.spacingS};

  width: 100%;
  height: 100%;
`;

/* 
  Different wrappers for the DragEditor to visually mimic the sidebar or field locations when a user is configuring widgets
*/
const locationWrappers = {
  Field: FieldWrapper,
  Sidebar: SidebarWrapper,
};

export const DragEditor = () => {
  const { elements, setElements, selectedElement, setSelectedElement, location } =
    useContext(WidgetEditorContext);

  const onDragEnd = (result: DropResult) => {
    if (!result || !result.destination) return;
    const newItems = Array.from(elements);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
    setElements(newItems);
  };

  const VisualWrapper = locationWrappers[location];

  return (
    <Flex flexDirection="column" gap="spacingM" alignItems="center" fullWidth fullHeight>
      <EditorContent>
        <VisualWrapper>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
              {(provided) => (
                <Flex
                  flexDirection="column"
                  gap="spacing2Xs"
                  {...provided.droppableProps}
                  ref={provided.innerRef}>
                  {elements.map((element, index) => {
                    return (
                      <Draggable key={element.key} draggableId={element.key} index={index}>
                        {(provided) => (
                          <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            onClick={() => setSelectedElement(element.key)}>
                            <DragElement
                              isSelected={selectedElement === element.key}
                              widgetDef={element}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </Flex>
              )}
            </Droppable>
          </DragDropContext>
        </VisualWrapper>
      </EditorContent>
    </Flex>
  );
};
