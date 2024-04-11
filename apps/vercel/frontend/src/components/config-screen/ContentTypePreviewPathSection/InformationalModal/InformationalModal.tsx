import { Paragraph, Flex, Modal, Button, Box, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { GrayInfoBox } from '@components/common/GrayInfoBox/GrayInfoBox';
import { copies } from '@constants/copies';
import { InformationalTables } from './InformationalTables/InformationalTables';
import { styles } from './InformationalModal.styles';
import { SDKProvider } from '@contentful/react-apps-toolkit';

interface Props {
  onClose: () => void;
  isShown: boolean;
}

export const InformationalModal = ({ onClose, isShown }: Props) => {
  const { title, button, exampleOne, exampleTwo, exampleThree, footer } =
    copies.configPage.contentTypePreviewPathSection.exampleModal;

  return (
    <SDKProvider>
      <Modal onClose={onClose} isShown={isShown} size="large">
        {() => (
          <>
            <Modal.Header title={title} onClose={onClose} />
            <Modal.Content>
              <Flex flexDirection="column" alignItems="baseline" gap={tokens.spacingS}>
                <Flex flexDirection="column" gap={tokens.spacingL}>
                  <Box>
                    <Paragraph className={styles.firstParagraph}>
                      {exampleOne.description}
                    </Paragraph>
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
                      {exampleThree.description}{' '}
                      <TextLink
                        href={exampleThree.link.href}
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer">
                        {exampleThree.link.copy}
                      </TextLink>
                    </Paragraph>
                  </Flex>
                </Flex>
                <InformationalTables />
                <Box className={styles.footer}>
                  <TextLink
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                    href={footer.href}>
                    {footer.copy}
                  </TextLink>{' '}
                </Box>
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
    </SDKProvider>
  );
};
