import { Accordion, Text, Flex, Badge } from '@contentful/f36-components';
import { ActionResultType } from '../locations/Page';
import useParseError from '../hooks/useParseError';
import { styles } from './Action.styles';
import RawResponseViewer from './RawResponseViewer';
import { computeDuration } from '../utils/response';

interface Props {
  actionResult: ActionResultType;
  accordionState: any;
  handleExpand: (itemKey: string) => void;
  handleCollapse: (itemKey: string) => void;
}

const ActionFailure = (props: Props) => {
  const { actionResult, accordionState, handleCollapse, handleExpand } = props;
  const { error, timestamp, actionId } = actionResult;
  const details: string | undefined = actionResult.call?.error?.details as string | undefined;
  const call = actionResult.call;
  const createdAt = call?.sys?.createdAt;
  const updatedAt = call?.sys?.updatedAt;
  const duration = computeDuration(createdAt, updatedAt);
  const { message, statusCode } = useParseError(error);

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <Badge variant="negative">Failed</Badge>
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
        <strong>Error Message:</strong> <Text>{message}</Text>
        {details && (
          <Text>
            <strong>Error Details:</strong>
            <Flex className={styles.bodyContainer}>
              <pre className={styles.body}>
                <code>{details}</code>
              </pre>
            </Flex>
          </Text>
        )}
        {actionResult.callId && (
          <RawResponseViewer actionId={actionId} callId={actionResult.callId} />
        )}
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionFailure;
