import { Accordion, Flex, IconButton, Stack, Text } from '@contentful/f36-components';
import { ActionResultType } from '../locations/Page';
import { CopyIcon } from '@contentful/f36-icons';
import { styles } from './Action.styles';

interface Props {
  actionResult: ActionResultType;
  accordionState: any;
  handleExpand: (itemKey: string) => void;
  handleCollapse: (itemKey: string) => void;
  handleCopy: (text: string, entityDescription: string) => void;
}

const ActionSuccess = (props: Props) => {
  const { actionResult, accordionState, handleCollapse, handleExpand, handleCopy } = props;
  const { data, timestamp, actionId } = actionResult;
  const statusCode = data?.response?.statusCode ?? (data as any)?.status;

  const getHeaderValue = (
    headers: Record<string, unknown> | undefined,
    key: string
  ): string | undefined => {
    if (!headers) return undefined;
    const entries = Object.entries(headers) as Array<[string, unknown]>;
    const match = entries.find(([k]) => k.toLowerCase() === key.toLowerCase());
    return (match?.[1] ?? undefined) as string | undefined;
  };

  const isJsonLike = (body: unknown, contentType?: string): boolean => {
    if (body == null) return false;
    if (typeof body !== 'string') return true;
    if (contentType && contentType.toLowerCase().includes('json')) return true;
    const trimmed = body.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  };

  const formatBodyForDisplay = (body?: unknown, contentType?: string): string => {
    if (body == null) return '';
    if (isJsonLike(body, contentType)) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        return JSON.stringify(parsed, null, 2);
      } catch {
        return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      }
    }
    return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  };

  const requestContentType =
    getHeaderValue((data as any)?.request?.headers as any, 'content-type') ||
    getHeaderValue((data as any)?.request?.headers as any, 'Content-Type');

  const responseContentType =
    getHeaderValue((data as any)?.response?.headers as any, 'content-type') ||
    getHeaderValue((data as any)?.response?.headers as any, 'Content-Type');

  const requestSource = (data as any)?.request?.body;
  const responseSource = (data as any)?.response?.body ?? (data as any)?.result;

  const requestBody = formatBodyForDisplay(requestSource, requestContentType);
  const responseBody = formatBodyForDisplay(responseSource, responseContentType);

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <span className={styles.accordionTitleSuccess}>'Success' [{statusCode}]</span> -{' '}
            {timestamp}
            {'function' in (data?.request || {}) && (
              <Text className={styles.accordionTitleMargin}>
                (Function: <strong>{data?.request?.function}</strong>)
              </Text>
            )}
            {typeof duration === 'number' && (
              <Text className={styles.accordionTitleMargin}>
                Duration: <strong>{duration}</strong> ms
              </Text>
            )}
          </Text>
        }
        isExpanded={accordionState[`outer-${actionId}-${timestamp}`]}
        onExpand={() => handleExpand(`outer-${actionId}-${timestamp}`)}
        onCollapse={() => handleCollapse(`outer-${actionId}-${timestamp}`)}>
        <Accordion>
          <Accordion.Item
            title={<Text className={styles.subAccordionTitle}>Request Details</Text>}
            isExpanded={accordionState[`request-${actionId}-${timestamp}`]}
            onExpand={() => handleExpand(`request-${actionId}-${timestamp}`)}
            onCollapse={() => handleCollapse(`request-${actionId}-${timestamp}`)}>
            <Stack flexDirection="column" alignItems="left" marginLeft="spacingXs">
              <Text>
                <strong>Request Headers:</strong>{' '}
                {data?.request?.headers &&
                  Object.entries(data?.request?.headers).map(([key, value]) => (
                    <div className={styles.requestHeaders} key={key}>
                      <strong>{key}:</strong> {`${value}`}
                    </div>
                  ))}
              </Text>
              <Text>
                <strong>Request Body:</strong>
                <Flex className={styles.bodyContainer}>
                  <pre className={styles.body}>
                    <code>{requestBody}</code>
                  </pre>
                  <IconButton
                    variant="transparent"
                    icon={<CopyIcon />}
                    aria-label="Copy request body"
                    onClick={() => handleCopy(requestBody, 'request body')}
                    className={styles.copyButton}
                  />
                </Flex>
              </Text>
            </Stack>
          </Accordion.Item>

          <Accordion.Item
            title={<Text className={styles.subAccordionTitle}>Response Details</Text>}
            isExpanded={accordionState[`response-${actionId}-${timestamp}`]}
            onExpand={() => handleExpand(`response-${actionId}-${timestamp}`)}
            onCollapse={() => handleCollapse(`response-${actionId}-${timestamp}`)}>
            <Stack flexDirection="column" alignItems="left" marginLeft="spacingXs">
              <Text>
                <strong>Response Body:</strong>
                <Flex className={styles.bodyContainer}>
                  <pre className={styles.body}>
                    <code>{responseBody}</code>
                  </pre>
                  <IconButton
                    variant="transparent"
                    icon={<CopyIcon />}
                    aria-label="Copy response body"
                    onClick={() => handleCopy(data?.response?.body || '', 'response body')}
                    className={styles.copyButton}
                  />
                </Flex>
              </Text>
              <Text>
                {data?.responseAt && (
                  <>
                    <strong>Response At:</strong> {new Date(data.responseAt).toLocaleString()}
                  </>
                )}
              </Text>
            </Stack>
          </Accordion.Item>
        </Accordion>
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionSuccess;
