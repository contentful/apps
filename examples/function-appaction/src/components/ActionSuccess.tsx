import { Accordion, Flex, IconButton, Stack, Text, Badge } from '@contentful/f36-components';
import { formatBodyForDisplay, computeDuration } from '../utils/response';
import RawResponseViewer from './RawResponseViewer';
import { CopyIcon } from '@contentful/f36-icons';
import { styles } from './Action.styles';
import { AppActionCallProps } from 'contentful-management';

interface Props {
  appActionCall: AppActionCallProps;
  accordionState: any;
  handleExpand: (itemKey: string) => void;
  handleCollapse: (itemKey: string) => void;
  handleCopy: (text: string, entityDescription: string) => void;
}

const ActionSuccess = (props: Props) => {
  const { appActionCall, accordionState, handleCollapse, handleExpand, handleCopy } = props;
  if (appActionCall.sys.status !== 'succeeded') {
    throw new Error('App action call is not succeeded');
  }

  const responseBody = formatBodyForDisplay(appActionCall.sys.result);
  const createdAt = appActionCall.sys.createdAt;
  const updatedAt = appActionCall.sys.updatedAt;
  const duration = computeDuration(createdAt, updatedAt);
  const timestamp = appActionCall.sys.createdAt;
  const actionId = appActionCall.sys.action.sys.id;

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <Badge variant="positive">Success</Badge>- {updatedAt}
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
                {appActionCall.sys.updatedAt && (
                  <>
                    <strong>Completed at:</strong>{' '}
                    {new Date(appActionCall.sys.updatedAt).toLocaleString()}
                  </>
                )}
              </Text>
              {appActionCall.sys.appActionCallResponse && (
                <RawResponseViewer
                  actionId={actionId}
                  callId={appActionCall.sys.appActionCallResponse.sys.id}
                />
              )}
            </Stack>
          </Accordion.Item>
        </Accordion>
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionSuccess;
