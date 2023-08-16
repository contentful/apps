import { useEffect, useState } from 'react';
import {
  Text,
  Button,
  Card,
  Paragraph,
  Subheading,
  Stack,
  Note,
  Switch,
  Flex,
  Tooltip,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import { styles } from './WorkspacePanel/styles';
import { NotificationItem } from './NotificationItem/NotificationItem';
import { ConnectedWorkspace, useWorkspaceStore } from '../workspace.store';
import { ContentTypeProps } from 'contentful-management';
import { useNotificationStore } from '../notification.store';
import { ChannelNote } from './ChannelNote';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';

const NOTIFICATION_LIMIT = 15;

interface Props {
  workspace: ConnectedWorkspace;
}

export const NotificationsPanel = (props: Props) => {
  const { workspace } = props;
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [setNotificationsLoading, notificationsLoading] = useWorkspaceStore((state) => [
    state.setNotificationsLoading,
    state.notificationsLoading,
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const sdk = useSDK<ConfigAppSDK>();
  const cma = sdk.cma;

  useEffect(() => {
    setErrors([]);
    const fetchContentTypes = async () => {
      try {
        const fetchedContentTypes = await cma.contentType.getMany({});
        setContentTypes(fetchedContentTypes.items);
      } catch (e) {
        setErrors((prevErrors) => [...prevErrors, 'ContentTypes']);
        console.error(e);
      }
    };
    const calls = [fetchContentTypes()];

    setNotificationsLoading(true);
    Promise.all(calls).finally(() => {
      setNotificationsLoading(false);
    });
  }, [cma, workspace, sdk]);

  const { active, notifications, createNotification, setActive } = useNotificationStore(
    (state) => ({
      active: state.active,
      notifications: state.notifications,
      createNotification: state.createNotification,
      setActive: state.setActive,
    }),
  );

  if (errors.length > 0) {
    return (
      <>
        <Subheading marginBottom="spacingS">Notifications</Subheading>
        <Note variant="warning" title="Notifications not available">
          Failed to load {errors.join(' and ')}
        </Note>
      </>
    );
  }

  if (notificationsLoading) {
    return (
      <div>
        <Subheading marginBottom="spacingS">Notifications</Subheading>
        <SkeletonContainer>
          <SkeletonBodyText numberOfLines={4} />
        </SkeletonContainer>
      </div>
    );
  }
  if (!contentTypes) {
    return null;
  }

  return (
    <>
      <Flex marginBottom="spacingS" alignItems="center">
        <Tooltip placement="bottom" content={`${active ? 'Disable' : 'Enable'} all notifications`}>
          <Switch isChecked={active} size="small" onChange={(e) => setActive(e.target.checked)} />
        </Tooltip>
        <Subheading marginBottom="none">Notifications</Subheading>
      </Flex>
      <Card padding="large">
        <Paragraph className={styles.paragraph}>
          Set up Slack notifications triggered when content changes in Contentful.{' '}
          {/* todo bring back once link is ready <TextLink href="#">Learn more about Slack notifications</TextLink>*/}
        </Paragraph>
        <ChannelNote />
        {notifications.map((notification, index) => (
          <NotificationItem
            key={index}
            index={index}
            contentTypes={contentTypes}
            notification={notification}
            workspace={workspace}
          />
        ))}
        <Stack alignItems="center">
          <Button
            onClick={() => createNotification()}
            startIcon={<PlusIcon />}
            size="small"
            variant="secondary"
            isDisabled={notifications.length >= NOTIFICATION_LIMIT}>
            {notifications.length > 0 ? 'Add another notification' : 'Add notification'}
          </Button>
          {notifications.length >= NOTIFICATION_LIMIT && (
            <Text fontSize="fontSizeS" fontColor="gray500">
              Limit of {NOTIFICATION_LIMIT} notifications reached
            </Text>
          )}
        </Stack>
      </Card>
    </>
  );
};
