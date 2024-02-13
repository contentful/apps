import { Flex, Text } from '@contentful/f36-components';
import { ErrorCircleIcon } from '@contentful/f36-icons';

interface Props {
  errorMessage: string;
}

const ErrorMessage = (props: Props) => {
  const { errorMessage } = props;
  return (
    <Flex alignItems="center" gap="spacingXs" paddingTop="spacingL" paddingBottom="spacingL">
      <ErrorCircleIcon variant="negative" />
      <Text fontColor="gray700">{errorMessage}</Text>
    </Flex>
  );
};

export default ErrorMessage;
