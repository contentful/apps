import { useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ExternalResourceLink } from 'types';
import ResourceCard from './ResourceCard';
import { Field } from '@contentful/default-field-editors';
import { Collapse, Grid, TextLink } from '@contentful/f36-components';
import { AddContentButton } from './AddContentButton';
import { SortableLinkList } from '@contentful/field-editor-reference';

interface Props {
  value: ExternalResourceLink[];
  isMultiple: boolean;
  addContent: () => void;
  onRemove: (index: number) => void;
  onMoveToTop?: (index: number) => void;
  onMoveToBottom?: (index: number) => void;
  total: number;
}

const ResourceField = (props: Props) => {
  const { value, isMultiple, addContent, onRemove, onMoveToTop, onMoveToBottom, total } = props;

  const sdk = useSDK<FieldAppSDK>();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <Grid rowGap="spacingM">
      {value && (
        <SortableLinkList<ExternalResourceLink>
          items={value}
          axis="y"
          useDragHandle={isMultiple}
          isInitiallyDisabled={true}
          isDisabled={false}
          hasCardEditActions={false}
          sdk={sdk}
          viewType={'card'}
          parameters={{ instance: {} }}>
          {({ item, DragHandle, index }) => {
            return (
              <Grid.Item>
                <ResourceCard
                  key={index}
                  index={index}
                  total={total}
                  value={item}
                  dragHandleRender={isMultiple ? DragHandle : undefined}
                  onRemove={onRemove}
                  onMoveToTop={onMoveToTop}
                  onMoveToBottom={onMoveToBottom}
                />
              </Grid.Item>
            );
          }}
        </SortableLinkList>
      )}
      <Grid.Item>
        {(isMultiple || !value.length) && <AddContentButton onClick={() => addContent()} />}
      </Grid.Item>
      <Grid.Item>
        <TextLink as="button" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Hide' : 'Show'} JSON
        </TextLink>
        <Collapse isExpanded={isExpanded}>
          <Field sdk={sdk} />
        </Collapse>
      </Grid.Item>
    </Grid>
  );
};

export default ResourceField;
