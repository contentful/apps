import { Box } from '@contentful/f36-components';
import ResourceList from './ResourceList';
import { styles } from './Dialog.styles';
import { ExternalResource } from 'types';

interface Props {
  externalResources: ExternalResource[];
  resourceProvider: string;
  resourceType: string;
}

const DialogBody = (props: Props) => {
  return (
    <Box className={styles.body}>
      <ResourceList {...props} />
    </Box>
  );
};

export default DialogBody;
