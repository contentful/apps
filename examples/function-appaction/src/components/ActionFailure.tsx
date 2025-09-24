import { Accordion, Text, Flex, Badge } from '@contentful/f36-components';
import useParseError from '../hooks/useParseError';
import { styles } from './Action.styles';
import RawResponseViewer from './RawResponseViewer';
import { computeDuration } from '../utils/response';
import type { AppActionCallProps } from 'contentful-management';

interface Props {
  appActionCall: AppActionCallProps;
  accordionState: any;
  handleExpand: (itemKey: string) => void;
  handleCollapse: (itemKey: string) => void;
}

const ActionFailure = (props: Props) => {
  const { appActionCall, accordionState, handleCollapse, handleExpand } = props;
  const { sys } = appActionCall;
  if (sys.status !== 'failed') {
    throw new Error('App action call is not failed');
  }
  const { error } = sys;
  const details = error.details;
  const duration = computeDuration(sys.createdAt, sys.updatedAt);
  const timestamp = sys.createdAt;
  const actionId = sys.action.sys.id;
  const { message, statusCode } = useParseError(error);

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <Badge variant="negative">Failed</Badge>
            <Text className={styles.accordionTitleMargin}>[{statusCode}]</Text> - {sys.updatedAt}
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
        <strong>Error Message:</strong> <Text>{message}</Text>
        {details && (
          <Text>
            <strong>Error Details:</strong>
            <Flex className={styles.bodyContainer}>
              <pre className={styles.body}>
                <code>{JSON.stringify(details, null, 2)}</code>
              </pre>
            </Flex>
          </Text>
        )}
        {appActionCall.sys.appActionCallResponse && (
          <RawResponseViewer
            actionId={actionId}
            callId={appActionCall.sys.appActionCallResponse.sys.id}
          />
        )}
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionFailure;
