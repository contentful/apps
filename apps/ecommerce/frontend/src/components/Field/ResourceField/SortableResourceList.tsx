import type { FieldAppSDK } from '@contentful/app-sdk';
import { Grid } from '@contentful/f36-components';
import { SortableLinkList } from '@contentful/field-editor-reference';
import { useSDK } from '@contentful/react-apps-toolkit';
import ResourceFieldContext from 'context/ResourceFieldContext';
import { useContext } from 'react';
import { ExternalResourceLink } from 'types';
import ResourceCard from '../ResourceCard';

const SortableResourceList = () => {
  const { resourceArray, isMultiple } = useContext(ResourceFieldContext);

  const sdk = useSDK<FieldAppSDK>();
  return (
    <SortableLinkList<ExternalResourceLink>
      items={resourceArray}
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
              total={resourceArray.length}
              value={item}
              dragHandleRender={isMultiple ? DragHandle : undefined}
            />
          </Grid.Item>
        );
      }}
    </SortableLinkList>
  );
};

export default SortableResourceList;
