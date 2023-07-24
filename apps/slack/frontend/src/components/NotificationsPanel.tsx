import React, { useEffect, useState } from 'react';
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
import { NotificationItem } from './NotificationItem';
import { ConnectedWorkspace, useWorkspaceStore } from '../workspace.store';
import { ContentTypeProps } from 'contentful-management';
import { useNotificationStore } from '../notification.store';
import { apiClient } from '../requests';
import { ChannelNote } from './ChannelNote';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';

const NOTIFICATION_LIMIT = 15;

interface Props {
  workspace: ConnectedWorkspace;
}

export const NotificationsPanel = (props: Props) => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [channels, setChannels, setNotificationsLoading, notificationsLoading] = useWorkspaceStore(
    (state) => [
      state.channels,
      state.setChannels,
      state.setNotificationsLoading,
      state.notificationsLoading,
    ]
  );
  const [errors, setErrors] = useState<string[]>([]);
  const cma = useCMA();
  const sdk = useSDK<AppExtensionSDK>();

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
    const fetchChannels = async () => {
      try {
        const fetchedChannels = await apiClient.getChannels(sdk, props.workspace.id, cma);
        if (Array.isArray(fetchedChannels)) {
          setChannels(fetchedChannels);
        }
      } catch (e) {
        setErrors((prevErrors) => [...prevErrors, 'Slack Channels']);
        console.error(e);
      }
    };
    const calls = [fetchContentTypes()];

    setNotificationsLoading(true);

    if (!channels) {
      calls.push(fetchChannels());
    }
    Promise.all(calls).finally(() => {
      setNotificationsLoading(false);
    });
  }, [cma, props.workspace, sdk]);

  const { active, notifications, createNotification, setActive } = useNotificationStore(
    (state) => ({
      active: state.active,
      notifications: state.notifications,
      createNotification: state.createNotification,
      setActive: state.setActive,
    })
  );

  if (errors.length > 0) {
    return (
      <>
        <Subheading marginBottom="spacingS">Notifications</Subheading>
        <Note variant="warning" title="Notifications not available">
          Notifications can&apos;t been shown. Failed to load {errors.join(' and ')}
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
  if (!channels || !contentTypes) {
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
            channels={channels}
            notification={notification}
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
