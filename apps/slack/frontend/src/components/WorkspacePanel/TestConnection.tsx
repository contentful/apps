import React, { useState } from 'react';
import { Button, Flex, Text, Spinner, Note, Select } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';

import { apiClient } from '../../requests';
import { SlackChannel } from '../../workspace.store';

interface Props {
  workspaceId: string;
}

export const TestConnection = ({ workspaceId }: Props) => {
  const sdk = useSDK<ConfigAppSDK>();
  const cma = sdk.cma;
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [showChannelSelect, setShowChannelSelect] = useState(false);
  const appActionId = process.env.APP_ACTION_ID || '';

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const fetchedChannels = await apiClient.getChannels(sdk, workspaceId, cma);
      if (Array.isArray(fetchedChannels)) {
        setChannels(fetchedChannels);
        setShowChannelSelect(true);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const testConnection = async () => {
    if (!selectedChannelId) {
      setTestResult({ success: false, message: 'Please select a channel first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Use the existing sendSlackMessage app action to send a test message
      const testMessage =
        '🔗 Connection test successful! Your Slack integration is working properly.';

      const result = await cma.appActionCall.createWithResult(
        {
          appActionId: appActionId,
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
          appDefinitionId: sdk.ids.app || '',
        },
        { parameters: { message: testMessage, channelId: selectedChannelId, workspaceId } }
      );

      if (result.sys.result.message.blocks) {
        setTestResult({ success: true, message: JSON.stringify(result.sys.result.message.blocks) });
      } else {
        setTestResult({
          success: false,
          message: 'Failed to send test message',
        });
      }
    } catch (error) {
      console.error('Test connection failed:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowChannelSelect(false);
  };

  return (
    <Flex gap="spacingS" fullWidth marginTop="spacingS" flexDirection="column">
      <Button onClick={fetchChannels} variant="secondary" size="small" isDisabled={loadingChannels}>
        {loadingChannels ? <Spinner size="small" /> : 'Test Connection'}
      </Button>

      {showChannelSelect && channels.length > 0 && (
        <Flex alignItems="center" gap="spacingS">
          <Text fontSize="fontSizeS">Select channel:</Text>
          <Select value={selectedChannelId} onChange={(e) => handleChannelSelect(e.target.value)}>
            <Select.Option value="">Choose a channel...</Select.Option>
            {channels.map((channel) => (
              <Select.Option key={channel.id} value={channel.id}>
                {channel.name}
              </Select.Option>
            ))}
          </Select>
        </Flex>
      )}

      {selectedChannelId && (
        <Button onClick={testConnection} variant="primary" size="small" isDisabled={isTesting}>
          {isTesting ? <Spinner size="small" /> : 'Send Test Message'}
        </Button>
      )}

      {testResult && (
        <Note
          variant={testResult.success ? 'positive' : 'negative'}
          title={testResult.success ? 'Success' : 'Error'}>
          {testResult.message}
        </Note>
      )}

      {showChannelSelect && channels.length === 0 && (
        <Note variant="warning" title="No channels available">
          No channels found. Make sure the Contentful app is added to at least one channel in your
          Slack workspace.
        </Note>
      )}
    </Flex>
  );
};
