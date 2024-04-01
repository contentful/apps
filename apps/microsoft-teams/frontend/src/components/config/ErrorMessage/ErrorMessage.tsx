import { Flex, Text } from '@contentful/f36-components';
import { ErrorCircleIcon } from '@contentful/f36-icons';
import { ErrorCircleOutlineIcon } from '@contentful/f36-icons';
import { ColorTokens } from '@contentful/f36-tokens';

interface Props {
  errorMessage: string;
  fontColor?: ColorTokens;
  hasOutlineIcon?: boolean;
}

const ErrorMessage = (props: Props) => {
  const { errorMessage, fontColor = 'colorNegative', hasOutlineIcon = true } = props;
  const errorIcon = hasOutlineIcon ? (
    <ErrorCircleOutlineIcon variant="negative" />
  ) : (
    <ErrorCircleIcon variant="negative" />
  );

  return (
    <Flex alignItems="center" gap="spacingXs">
      {errorIcon}
      <Text fontColor={fontColor}>{errorMessage}</Text>
    </Flex>
  );
};

export default ErrorMessage;
