import { useState } from 'react';
import { type ComponentProps } from 'react';
import { Button, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { CheckCircleIcon } from '@contentful/f36-icons';

type OAuthConnectorProps = {
  isOAuthConnected: boolean;
  isOAuthBusy: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
};

const ConnectedStatusIcon = ({ size }: Pick<ComponentProps<typeof CheckCircleIcon>, 'size'>) => (
  <CheckCircleIcon size={size} color={tokens.colorPositive} />
);

export const OAuthConnector = ({
  isOAuthConnected,
  isOAuthBusy,
  onConnect,
  onDisconnect,
}: OAuthConnectorProps) => {
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);

  const getButtonText = () => {
    if (isOAuthBusy) {
      return isOAuthConnected && isHoveringConnected ? 'Disconnecting' : 'Connecting';
    }

    if (isOAuthConnected && isHoveringConnected) return 'Disconnect';
    if (isOAuthConnected) return 'Connected';
    return 'Connect';
  };

  const handleButtonClick = async () => {
    if (isOAuthBusy) return;

    if (isOAuthConnected && isHoveringConnected) {
      await onDisconnect();
      return;
    }

    if (!isOAuthConnected) {
      await onConnect();
    }
  };

  return (
    <Flex
      gap="spacingXs"
      alignItems="center"
      onMouseEnter={() => {
        if (isOAuthConnected) {
          setIsHoveringConnected(true);
        }
      }}
      onMouseLeave={() => {
        setIsHoveringConnected(false);
      }}>
      {isOAuthConnected && isHoveringConnected && (
        <Text
          fontSize="fontSizeS"
          fontWeight="fontWeightMedium"
          lineHeight="lineHeightS"
          fontColor="gray500">
          Status: connected
        </Text>
      )}
      <Button
        variant={isOAuthConnected && isHoveringConnected ? 'negative' : 'secondary'}
        size="small"
        startIcon={isOAuthConnected && !isHoveringConnected ? <ConnectedStatusIcon /> : undefined}
        onClick={() => void handleButtonClick()}
        isLoading={isOAuthBusy}
        isDisabled={isOAuthBusy}>
        {getButtonText()}
      </Button>
    </Flex>
  );
};
