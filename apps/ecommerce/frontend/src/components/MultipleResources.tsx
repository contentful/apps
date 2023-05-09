import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ExternalResourceLink, ProviderLabel } from '../types';
import ResourceCard from './ResourceCard';
import { Field } from '@contentful/default-field-editors';
import { Collapse, Grid, TextLink } from '@contentful/f36-components';
import { AddContentButton } from './AddContentButton';
import { SortableLinkList } from '@contentful/field-editor-reference';
import { startCase } from 'lodash';

const MultipleResources = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ExternalResourceLink[]>(sdk.field.getValue());
  const [total, setTotal] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
      setTotal(value?.length);
    });
  }, [sdk.field, setValue]);

  const onRemove = (index: number) => {
    const newValue = value.filter((obj, i) => i !== index);
    sdk.field.setValue(newValue);
  };

  const onMoveToTop = (index: number) => {
    const newValue = [...value];
    newValue.unshift(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  const onMoveToBottom = (index: number) => {
    const newValue = [...value];
    newValue.push(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  const mockValue: ExternalResourceLink = {
    sys: {
      urn: crypto.randomUUID(),
      type: 'ResourceLink',
      linkType: sdk.parameters.instance.linkType,
      provider: startCase(sdk.parameters.instance.provider) as ProviderLabel,
    },
  };

  return (
    <Grid rowGap="spacingM">
      {value && (
        <SortableLinkList<ExternalResourceLink>
          items={value}
          axis="y"
          useDragHandle={true}
          isInitiallyDisabled={true}
          isDisabled={false}
          hasCardEditActions={false}
          sdk={sdk}
          viewType={'card'}
          parameters={{ instance: {} }}>
          {({ item, isDisabled, DragHandle, index }) => {
            return (
              <Grid.Item>
                <ResourceCard
                  key={index}
                  index={index}
                  total={total}
                  value={item}
                  dragHandleRender={DragHandle}
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
        <AddContentButton onClick={() => sdk.field.setValue([...value, mockValue])} />
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

export default MultipleResources;
