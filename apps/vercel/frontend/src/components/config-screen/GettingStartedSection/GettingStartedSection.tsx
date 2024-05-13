import { Flex, Heading, Paragraph, Box, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { styles } from '@locations/ConfigScreen.styles';
import { copies } from '@constants/copies';

export const GettingStartedSection = () => {
  const { contentPreviewSidebar, contentPreviewSettings, title, link } =
    copies.configPage.gettingStartedSection;
  return (
    <Box>
      <Heading className={styles.heading}>{title}</Heading>
      <Flex>
        <Paragraph>{contentPreviewSidebar.copy}</Paragraph>
        <img src={contentPreviewSidebar.src} alt="Content preview sidebar screen capture" />
      </Flex>
      <Flex>
        <Paragraph>{contentPreviewSettings.copy}</Paragraph>
        <img src={contentPreviewSettings.src} alt="Content preview settings screen capture" />
      </Flex>
      <Flex marginTop="spacingM" gap={tokens.spacing2Xs} alignItems="center">
        Need help with app setup? Follow this
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer">
          app setup guide
        </TextLink>{' '}
      </Flex>
    </Box>
  );
};
