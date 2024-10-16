import { Accordion, Text } from '@contentful/f36-components';
import { ActionResultType } from '../locations/Page';
import useParseError from '../hooks/useParseError';
import { styles } from './Action.styles';

interface Props {
  actionResult: ActionResultType;
  accordionState: any;
  handleExpand: (itemKey: string) => void;
  handleCollapse: (itemKey: string) => void;
}

const ActionFailure = (props: Props) => {
  const { actionResult, accordionState, handleCollapse, handleExpand } = props;
  const { error, timestamp, actionId } = actionResult;
  const { message, statusCode } = useParseError(error);

  return (
    <Accordion key={`${actionId}-${timestamp}`} className={styles.accordion}>
      <Accordion.Item
        title={
          <Text>
            <span className={styles.accordionTitleFailure}>'Failed' [{statusCode}]</span> -{' '}
            {timestamp}
          </Text>
        }
        isExpanded={accordionState[`outer-${actionId}-${timestamp}`]}
        onExpand={() => handleExpand(`outer-${actionId}-${timestamp}`)}
        onCollapse={() => handleCollapse(`outer-${actionId}-${timestamp}`)}>
        <strong>Error Message:</strong> <Text>{message}</Text>
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionFailure;
