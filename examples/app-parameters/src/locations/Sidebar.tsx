import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeActions from '../components/ContentTypeActions';
import ContentTypeInfo from '../components/ContentTypeInfo';
import { styles } from './Sidebar.styles';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  // Access the instance parameter value to get the content type color
  const { instance: instanceParams } = sdk.parameters;

  useAutoResizer();

  return (
    <Box className={styles.box(instanceParams.contentTypeColor)}>
      <ContentTypeInfo />
      <ContentTypeActions />
    </Box>
  );
};

export default Sidebar;
