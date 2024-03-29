import { Paragraph, Flex, Modal, Button, Box, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { GrayInfoBox } from '@components/common/GrayInfoBox/GrayInfoBox';
import { copies } from '@constants/copies';
import { InformationalTables } from './InformationalTables/InformationalTables';
import { styles } from './InformationalModal.styles';

interface Props {
  onClose: () => void;
  isShown: boolean;
}

export const InformationalModal = ({ onClose, isShown }: Props) => {
  const { title, button, exampleOne, exampleTwo, exampleThree } =
    copies.configPage.contentTypePreviewPathSection.exampleModal;

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Flex flexDirection="column" gap={tokens.spacingS}>
              <Flex flexDirection="column" gap={tokens.spacingL}>
                <Box>
                  <Paragraph className={styles.firstParagraph}>{exampleOne.description}</Paragraph>
                  <GrayInfoBox>{exampleOne.example}</GrayInfoBox>
                </Box>

                <Flex
                  className={styles.zeroMarginBottom}
                  alignItems="flex-start"
                  gap={tokens.spacingS}>
                  <GrayInfoBox>{exampleTwo.example}</GrayInfoBox>
                  <Paragraph className={styles.zeroMarginBottom}>
                    {exampleTwo.description}
                  </Paragraph>
                </Flex>

                <Flex alignItems="flex-start" gap={tokens.spacingS}>
                  <GrayInfoBox>{exampleThree.example}</GrayInfoBox>
                  <Paragraph>
                    {exampleThree.description} <TextLink>custom preview tokens</TextLink>
                  </Paragraph>
                </Flex>
              </Flex>

              <InformationalTables />

              <Paragraph className={styles.footer}>
                For more details about preview URLs, <TextLink>read the docs.</TextLink>{' '}
              </Paragraph>
            </Flex>
          </Modal.Content>
          <Modal.Controls>
            <Button size="small" variant="primary" onClick={onClose}>
              {button}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
