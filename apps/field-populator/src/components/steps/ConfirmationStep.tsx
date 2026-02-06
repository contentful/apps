import { Box, List, Paragraph, Text } from '@contentful/f36-components';
import { UpdateResult } from '../../utils/entry';

interface ConfirmationStepProps {
  result: UpdateResult;
}

const ConfirmationStep = ({ result }: ConfirmationStepProps) => {
  const { fieldsUpdated, entriesUpdated, errors } = result;
  const fieldText = fieldsUpdated === 1 ? 'field' : 'fields';
  const entryText = entriesUpdated === 1 ? 'entry' : 'entries';

  if (errors) {
    return (
      <Box>
        <Paragraph fontWeight="fontWeightDemiBold">Some updates failed</Paragraph>
        <Paragraph>
          Adopted {fieldsUpdated} {fieldText} across {entriesUpdated} {entryText}.
        </Paragraph>
        <Paragraph>The following updates failed:</Paragraph>
        <List>
          {errors.map((error) => (
            <List.Item key={error}>
              <Text>{error}</Text>
            </List.Item>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box>
      <Paragraph fontWeight="fontWeightDemiBold">Changes applied</Paragraph>
      <Paragraph>
        Adopted {fieldsUpdated} {fieldText} across {entriesUpdated} {entryText}.
      </Paragraph>
    </Box>
  );
};

export default ConfirmationStep;
