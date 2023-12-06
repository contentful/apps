import { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  Modal,
  Paragraph,
  Radio,
  Table,
  TextLink,
} from '@contentful/f36-components';
import { appDeepLink, channelSelection } from '@constants/configCopy';
import { styles } from './ChannelSelectionModal.styles';
import { AppInstallationParameters, Notification, TeamsChannel } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import EmptyState from '@components/config/EmptyState/EmptyState';
import EmptyFishbowl from '@components/config/EmptyState/EmptyFishbowl';
import { ConfigAppSDK } from '@contentful/app-sdk';

interface Props {
  isShown: boolean;
  onClose: () => void;
  savedChannelId: string;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  sdk: ConfigAppSDK;
  channels: TeamsChannel[];
  setChannels: (channels: TeamsChannel[]) => void;
}

const ChannelSelectionModal = (props: Props) => {
  const { isShown, onClose, savedChannelId, handleNotificationEdit, sdk, channels, setChannels } =
    props;
  const [selectedChannelId, setSelectedChannelId] = useState<string>(savedChannelId ?? '');
  const [, setLoading] = useState<boolean>(false);
  const { tenantId } = sdk.parameters.instance as AppInstallationParameters;
  const { title, button, link, emptyContent, emptyHeading, description } = channelSelection.modal;

  useEffect(() => {
    const handleAppActionCall = async () => {
      setLoading(true);
      if (isShown) {
        const { response } = await sdk.cma.appActionCall.createWithResponse(
          {
            appActionId: 'msteamsListChannels',
            environmentId: sdk.ids.environment,
            spaceId: sdk.ids.space,
            appDefinitionId: sdk.ids.app!,
          },
          {
            parameters: { tenantId },
          }
        );
        const body = JSON.parse(response.body);
        if (body.ok) {
          setLoading(false);
          setChannels(body.data);
        } else {
          setLoading(false);
        }
      }
    };

    handleAppActionCall();
  }, [isShown, sdk]);

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <ModalHeader title={title} onClose={onClose} icon={<TeamsLogo />} />
          <Modal.Content>
            {channels.length ? (
              <>
                <Paragraph>
                  {description}{' '}
                  <TextLink href={appDeepLink} target="_blank" rel="noopener noreferrer">
                    {link}
                  </TextLink>
                </Paragraph>
                <FormControl as="fieldset" marginBottom="none">
                  <Table className={styles.table}>
                    <Table.Body>
                      {channels.map((channel) => (
                        <Table.Row key={channel.id}>
                          <Table.Cell>
                            <Radio
                              id={channel.id}
                              isChecked={selectedChannelId === channel.id}
                              onChange={() => setSelectedChannelId(channel.id)}
                              helpText={channel.teamName}>
                              {channel.name}
                            </Radio>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </FormControl>
              </>
            ) : (
              <EmptyState
                image={<EmptyFishbowl />}
                heading={emptyHeading}
                body={emptyContent}
                linkSubstring={link}
                linkHref={appDeepLink}
              />
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                handleNotificationEdit({ channelId: selectedChannelId });
                onClose();
              }}
              isDisabled={!selectedChannelId}>
              {button}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default ChannelSelectionModal;
