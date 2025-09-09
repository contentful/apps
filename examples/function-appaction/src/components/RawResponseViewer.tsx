import { Button, Flex, IconButton, Text, Tabs } from '@contentful/f36-components';
import { CopyIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { useState } from 'react';
import { formatBodyForDisplay, getHeaderValue, computeDuration } from '../utils/response';
import { styles } from './Action.styles';

interface Props {
  actionId: string;
  callId?: string;
  onLoaded?: (info: { contentType?: string; body?: string; duration?: number }) => void;
  title?: string;
}

const RawResponseViewer = ({
  actionId,
  callId,
  onLoaded,
  title = 'Raw Response (getResponse)',
}: Props) => {
  const sdk = useSDK<PageAppSDK>();
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<any | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'pretty' | 'raw'>('pretty');

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(
      () => sdk.notifier.success(`Copied ${description} to clipboard.`),
      () => sdk.notifier.error(`Failed to copy ${description}.`)
    );
  };

  const onGet = async () => {
    if (!callId) return;
    setLoading(true);
    setError(undefined);
    try {
      const response = (await sdk.cma.appActionCall.getResponse({
        appDefinitionId: sdk.ids.app || '',
        appActionId: actionId,
        callId,
      })) as any;
      setRaw(response);
      const contentType =
        getHeaderValue(response?.response?.headers as any, 'content-type') ||
        getHeaderValue(response?.response?.headers as any, 'Content-Type') ||
        getHeaderValue(response?.response?.headers as any, 'contentType');
      const formatted = formatBodyForDisplay(response?.response?.body, contentType);
      const duration = computeDuration(
        response?.sys?.createdAt ?? response?.requestAt,
        response?.sys?.updatedAt ?? response?.responseAt
      );
      onLoaded?.({ contentType, body: formatted, duration });
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch raw response');
    } finally {
      setLoading(false);
    }
  };

  const contentType =
    getHeaderValue(raw?.response?.headers as any, 'content-type') ||
    getHeaderValue(raw?.response?.headers as any, 'Content-Type') ||
    getHeaderValue(raw?.response?.headers as any, 'contentType');

  return (
    <>
      <Text>
        <strong>{title}:</strong>
      </Text>
      <Button
        variant="secondary"
        isLoading={loading}
        isDisabled={loading}
        onClick={onGet}
        aria-label="Get Raw Response">
        Get Raw Response
      </Button>
      {error && (
        <Text>
          <strong>Error:</strong> {error}
        </Text>
      )}
      {raw && (
        <>
          <Tabs
            defaultTab="pretty"
            onTabChange={(id) => setMode((id as 'pretty' | 'raw') || 'pretty')}>
            <Tabs.List>
              <Tabs.Tab panelId="pretty">Pretty</Tabs.Tab>
              <Tabs.Tab panelId="raw">Raw</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel id="pretty">
              <Text>
                <Flex className={styles.bodyContainer}>
                  <pre className={styles.body}>
                    <code>
                      {formatBodyForDisplay(raw?.response?.body ?? raw?.body, contentType)}
                    </code>
                  </pre>
                  <IconButton
                    variant="transparent"
                    icon={<CopyIcon />}
                    aria-label="Copy pretty body"
                    onClick={() =>
                      handleCopy(
                        formatBodyForDisplay(raw?.response?.body ?? raw?.body, contentType),
                        'pretty body'
                      )
                    }
                    className={styles.copyButton}
                  />
                </Flex>
              </Text>
            </Tabs.Panel>
            <Tabs.Panel id="raw">
              <Text>
                <Flex className={styles.bodyContainer}>
                  <pre className={styles.body}>
                    <code>{JSON.stringify(raw?.response ?? raw, null, 2)}</code>
                  </pre>
                  <IconButton
                    variant="transparent"
                    icon={<CopyIcon />}
                    aria-label="Copy raw response"
                    onClick={() =>
                      handleCopy(JSON.stringify(raw?.response ?? raw, null, 2), 'raw response')
                    }
                    className={styles.copyButton}
                  />
                </Flex>
              </Text>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </>
  );
};

export default RawResponseViewer;
