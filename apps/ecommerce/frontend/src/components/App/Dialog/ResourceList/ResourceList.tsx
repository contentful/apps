import { Flex } from '@contentful/f36-components';
import ProductCard from 'components/Common/ProductCard';
import { styles } from './ResourceList.styles';
import { ExternalResource } from 'types';

interface Props {
  externalResources: ExternalResource[];
  resourceProvider: string;
  resourceType: string;
  onSelect: (resource: ExternalResource) => void;
  selectedResources: ExternalResource[];
}

const ResourceList = (props: Props) => {
  const { externalResources, resourceProvider, resourceType, onSelect, selectedResources } = props;
  const selectedResourceIds = new Set(selectedResources.map((item) => item.id));

  return (
    <Flex className={styles.productList}>
      {externalResources.map((externalResource, index) => {
        const isSelectedResource = selectedResourceIds.has(externalResource.id);
        return (
          <ProductCard
            key={index}
            resource={externalResource}
            cardHeader={`${resourceProvider} ${resourceType}`}
            onSelect={onSelect}
            isSelected={Boolean(isSelectedResource)}
          />
        );
      })}
    </Flex>
  );
};

export default ResourceList;
