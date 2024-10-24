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
  const statusCode = data?.response?.statusCode;
  const duration =
    data && new Date(data.responseAt).getMilliseconds() - new Date(timestamp).getMilliseconds();
  const requestBody = JSON.stringify(JSON.parse(data?.request?.body || ''), null, 2);
  const responseBody = JSON.stringify(JSON.parse(data?.response?.body || ''), null, 2);

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
                    onClick={() => handleCopy(data?.response?.body || '', 'request body')}
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
