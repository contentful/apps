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

  return (
    <Flex className={styles.productList}>
      {externalResources.map((item, index) => {
        const isSelectedResource = selectedResources.find((selectedItem) => {
          return selectedItem.id === item.id;
        });
        return (
          <ProductCard
            key={index}
            resource={item}
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
