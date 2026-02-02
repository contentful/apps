import { Box, Flex, Heading, Note, Paragraph } from '@contentful/f36-components';
import { UpdateResult } from '../utils/updateEntry';
import { styles } from './ConfirmationStepComponent.styles';

interface ConfirmationStepComponentProps {
  result: UpdateResult;
}

const ConfirmationStepComponent = ({ result }: ConfirmationStepComponentProps) => {
  const { success, fieldsUpdated, entriesUpdated, error } = result;

  if (success) {
    const fieldText = fieldsUpdated === 1 ? 'field' : 'fields';
    const entryText = entriesUpdated === 1 ? 'entry' : 'entries';

    return (
      <Flex flexDirection="column" alignItems="center" className={styles.container}>
        <Heading marginBottom="spacingS">Changes applied</Heading>
        <Paragraph fontColor="gray700">
          Adopted {fieldsUpdated} {fieldText} across {entriesUpdated} {entryText}.
        </Paragraph>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" alignItems="center" className={styles.container}>
      <Heading marginBottom="spacingS">Update failed</Heading>
      <Box marginTop="spacingM" style={{ width: '100%', maxWidth: '400px' }}>
        <Note variant="negative">{error || 'An unexpected error occurred'}</Note>
      </Box>
    </Flex>
  );
};

export default ConfirmationStepComponent;
