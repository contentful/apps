import { Accordion, Text } from '@contentful/f36-components';
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
  const data: any = actionResult.data;
  const createdAt = data?.sys?.createdAt ?? data?.requestAt;
  const updatedAt = data?.sys?.updatedAt ?? data?.responseAt;
  const duration = computeDuration(createdAt, updatedAt);
  const { message, statusCode } = useParseError(error);

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <span className={styles.accordionTitleFailure}>'Failed' [{statusCode}]</span> -{' '}
            {timestamp}
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
        {actionResult.callId && (
          <RawResponseViewer actionId={actionId} callId={actionResult.callId} />
        )}
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionFailure;
