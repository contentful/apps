import { Flex } from '@contentful/f36-components';
import ResourceCard from './ResourceCard/ResourceCard';
import { styles } from './Dialog.styles';
import { ExternalResource } from 'types';

interface Props {
  externalResources: ExternalResource[];
  resourceProvider: string;
  resourceType: string;
}

const ResourceList = (props: Props) => {
  const { externalResources, resourceProvider, resourceType } = props;

  return (
    <Flex className={styles.productList}>
      {externalResources.map((item, index) => {
        return (
          <ResourceCard
            key={index}
            resource={item}
            cardHeader={`${resourceProvider} ${resourceType}`}
          />
        );
      })}
    </Flex>
  );
};

export default ResourceList;
