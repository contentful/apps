import { copies } from '@constants/copies';
import { Flex, Heading, Paragraph, Box } from '@contentful/f36-components';
import { styles } from '@locations/ConfigScreen.styles';

export const GettingStartedSection = () => {
  const { contentPreviewSidebar, contentPreviewSettings, title } =
    copies.configPage.gettingStartedSection;
  return (
    <Box>
      <Heading className={styles.heading}>{title}</Heading>
      <Flex>
        <Paragraph>{contentPreviewSidebar.copy}</Paragraph>
        <img src={contentPreviewSidebar.src} />
      </Flex>
      <Flex>
        <Paragraph>{contentPreviewSettings.copy}</Paragraph>
        <img src={contentPreviewSettings.src} />
      </Flex>
    </Box>
  );
};
