import { Accordion, Flex, IconButton, Stack, Text, Badge } from '@contentful/f36-components';
import { getHeaderValue, formatBodyForDisplay, computeDuration } from '../utils/response';
import RawResponseViewer from './RawResponseViewer';
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

  const responseContentType =
    getHeaderValue((data as any)?.response?.headers as any, 'content-type') ||
    getHeaderValue((data as any)?.response?.headers as any, 'Content-Type');
  const responseSource = (data as any)?.response?.body ?? (data as any)?.result;
  const responseBody = formatBodyForDisplay(responseSource, responseContentType);

  // Prefer structured call timestamps (sys.createdAt -> sys.updatedAt) only
  const createdAt = (data as any)?.sys?.createdAt;
  const updatedAt = (data as any)?.sys?.updatedAt;
  const duration = computeDuration(createdAt, updatedAt);

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <Badge variant="positive">Success</Badge>
            <Text className={styles.accordionTitleMargin}>[{statusCode}]</Text> - {timestamp}
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
                    onClick={() => handleCopy(responseBody, 'response body')}
                    className={styles.copyButton}
                  />
                </Flex>
              </Text>
              <Text>
                {(data as any)?.sys?.updatedAt && (
                  <>
                    <strong>Completed at:</strong>{' '}
                    {new Date((data as any).sys.updatedAt).toLocaleString()}
                  </>
                )}
              </Text>
              {actionResult.callId && (
                <RawResponseViewer actionId={actionId} callId={actionResult.callId} />
              )}
            </Stack>
          </Accordion.Item>
        </Accordion>
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionSuccess;
