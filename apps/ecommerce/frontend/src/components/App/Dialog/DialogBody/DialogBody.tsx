import { Box } from '@contentful/f36-components';
import ResourceList from '../ResourceList/ResourceList';
import { styles } from './DialogBody.styles';
import { ExternalResource } from 'types';

interface Props {
  externalResources: ExternalResource[];
  resourceProvider: string;
  resourceType: string;
  onSelect: (resource: ExternalResource) => void;
  selectedResources: ExternalResource[];
}

const DialogBody = (props: Props) => {
  return (
    <Box className={styles.body}>
      <ResourceList {...props} />
    </Box>
  );
};

export default DialogBody;
