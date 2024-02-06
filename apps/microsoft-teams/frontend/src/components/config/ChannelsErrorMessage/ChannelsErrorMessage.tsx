import { channelSelection } from '@constants/configCopy';
import { Flex, Text } from '@contentful/f36-components';
import { ErrorCircleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

const ChannelsErrorMessage = () => {
  const { errorMessage } = channelSelection.modal;
  return (
    <Flex alignItems="center" gap={tokens.spacingXs} paddingTop="spacingL" paddingBottom="spacingL">
      <ErrorCircleIcon variant="negative" />
      <Text fontColor="gray700">{errorMessage}</Text>
    </Flex>
  );
};

export default ChannelsErrorMessage;
