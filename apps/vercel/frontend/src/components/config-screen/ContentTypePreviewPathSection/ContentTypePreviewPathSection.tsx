import { Box, Heading, Paragraph } from '@contentful/f36-components';

import { styles } from '@locations/ConfigScreen.styles';
import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList/ContentTypePreviewPathSelectionList';
import { PreviewPathInfoNote } from './PreviewPathInfoNote/PreviewPathInfoNote';
import { copies } from '@constants/copies';
import { useContext } from 'react';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';

export const ContentTypePreviewPathSection = () => {
  const { title, description } = copies.configPage.contentTypePreviewPathSection;
  const { handleAppConfigurationChange } = useContext(ConfigPageContext);

  return (
    <Box
      onClick={handleAppConfigurationChange}
      data-testid="content-type-preview-path-section"
      className={styles.box}>
      <Heading marginBottom="none" className={styles.heading}>
        {title}
      </Heading>
      <Paragraph marginTop="spacingXs">{description}</Paragraph>
      <PreviewPathInfoNote />
      <ContentTypePreviewPathSelectionList />
    </Box>
  );
};
