import { useContext } from 'react';
import { ContentTypeContext } from '@context/ContentTypeProvider';
import { Box, Button, Flex, Subheading, Paragraph, Switch } from '@contentful/f36-components';
import { styles } from './NotificationViewMode.styles';
import { getContentTypeName, getChannelName } from '@helpers/configHelpers';
import { Notification } from '@customTypes/configPage';
import {
  channelSelection,
  contentTypeSelection,
  notificationsSection,
} from '@constants/configCopy';
// TODO: update this when we start fetching channel installations
import mockChannels from '@test/mocks/mockChannels.json';

interface Props {
  index: number;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
  handleEdit: () => void;
  isEditDisabled: boolean;
}

const NotificationViewMode = (props: Props) => {
  const { index, notification, updateNotification, handleEdit, isEditDisabled } = props;
  const { contentTypes } = useContext(ContentTypeContext);

  return (
    <Box className={styles.wrapper}>
      <Flex justifyContent="space-between">
        <Flex flexDirection="column">
          <Subheading marginBottom="none">
            {getContentTypeName(
              notification.contentTypeId,
              contentTypes,
              contentTypeSelection.notFound
            )}
          </Subheading>
          <Paragraph marginBottom="none">
            {getChannelName(notification.channelId, mockChannels, channelSelection.notFound)}
          </Paragraph>
        </Flex>
        <Flex alignItems="center">
          <Paragraph marginBottom="none" marginRight="spacingXs">
            {notificationsSection.enabledToggle}
          </Paragraph>
          <Switch
            name="enable-notification"
            id="enable-notification"
            isChecked={notification.isEnabled}
            onChange={() => updateNotification(index, { isEnabled: !notification.isEnabled })}
          />
          <Box marginLeft="spacingXs">
            <Button
              variant="secondary"
              size="small"
              onClick={handleEdit}
              isDisabled={isEditDisabled}>
              {notificationsSection.editButton}
            </Button>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default NotificationViewMode;
