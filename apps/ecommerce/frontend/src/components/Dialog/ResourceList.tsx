import { Flex } from '@contentful/f36-components';
import ResourceCard from './ResourceCard/ResourceCard';
import { styles } from './Dialog.styles';
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
        return (
          <ResourceCard
            key={index}
            resource={item}
            cardHeader={`${resourceProvider} ${resourceType}`}
            onSelect={onSelect}
            selectedResources={selectedResources}
          />
        );
      })}
    </Flex>
  );
};

export default ResourceList;
