import { useState } from 'react';
import { type ComponentProps } from 'react';
import { Button, Flex, Text, Image } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { CheckCircleIcon } from '@contentful/f36-icons';
import googleDriveLogo from '../../../../assets/drive-integration.svg';

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
      alignItems="center"
      justifyContent="space-between"
      style={{
        padding: `${tokens.spacingS} ${tokens.spacingL}`,
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusMedium,
      }}>
      <Flex gap="spacingS" alignItems="center" justifyContent="center">
        <Flex
          alignItems="center"
          justifyContent="center"
          style={{
            height: '40px',
            width: '40px',
            border: `1px solid ${tokens.gray300}`,
            borderRadius: tokens.borderRadiusMedium,
            backgroundColor: tokens.gray100,
          }}>
          <Image src={googleDriveLogo} alt="Google Drive Integration" height="28px" width="32px" />
        </Flex>
        <Text fontSize="fontSizeL" fontWeight="fontWeightMedium" lineHeight="lineHeightL">
          Google Drive Integration
        </Text>
      </Flex>
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
          endIcon={isOAuthConnected && !isHoveringConnected ? <ConnectedStatusIcon /> : undefined}
          onClick={() => void handleButtonClick()}
          isLoading={isOAuthBusy}
          isDisabled={isOAuthBusy}>
          {getButtonText()}
        </Button>
      </Flex>
    </Flex>
  );
};
