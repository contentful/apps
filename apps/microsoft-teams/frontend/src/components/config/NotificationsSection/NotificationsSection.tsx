import { Box, Subheading } from '@contentful/f36-components';
import { styles } from './NotificationsSection.styles';
import { notificationsSection } from '@constants/configCopy';
import AddButton from '@components/config/AddButton/AddButton';

const NotificationsSection = () => {
  return (
    <Box className={styles.box}>
      <Subheading>{notificationsSection.title}</Subheading>
      <AddButton buttonCopy={notificationsSection.buttons.create} />
    </Box>
  );
};

export default NotificationsSection;
