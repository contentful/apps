import { Grid } from '@contentful/f36-components';
import { SortableLinkList } from '@contentful/field-editor-reference';
import { useContext } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import ResourceFieldContext from 'context/ResourceFieldContext';
import type { ExternalResourceLink } from 'types';
import type { FieldAppSDK } from '@contentful/app-sdk';
import ProductCardWrapper from 'components/Common/ProductCard/ProductCardWrapper/ProductCardWrapper';

interface Props {
  resourceArray: ExternalResourceLink[];
}

const SortableResourceList = (props: Props) => {
  const { resourceArray } = props;
  const { isMultiple } = useContext(ResourceFieldContext);

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
            <ProductCardWrapper
              externalResourceLink={item}
              dragHandleRender={DragHandle}
              cardIndex={index}
              resourceArray={resourceArray}
              productCardType="field"
            />
          </Grid.Item>
        );
      }}
    </SortableLinkList>
  );
};

export default SortableResourceList;
