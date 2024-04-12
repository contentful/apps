import { Box, Heading, Paragraph } from '@contentful/f36-components';
import { ContentType } from '@contentful/app-sdk';
import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { styles } from '@locations/ConfigScreen.styles';
import { AppInstallationParameters } from '@customTypes/configPage';
import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList/ContentTypePreviewPathSelectionList';
import { PreviewPathInfoNote } from './PreviewPathInfoNote/PreviewPathInfoNote';
import { copies } from '@constants/copies';

interface Props {
  parameters: AppInstallationParameters;
  dispatch: Dispatch<ParameterAction>;
  contentTypes: ContentType[];
}

export const ContentTypePreviewPathSection = ({ parameters, dispatch, contentTypes }: Props) => {
  const { contentTypePreviewPathSelections } = parameters;
  const { heading, subHeading } = copies.configPage.contentTypePreviewPathSection;

  return (
    <Box data-testid="content-type-preview-path-section" className={styles.box}>
      <Heading marginBottom="none" className={styles.heading}>
        {heading}
      </Heading>
      <Paragraph marginTop="spacingXs">{subHeading}</Paragraph>
      <PreviewPathInfoNote />
      <ContentTypePreviewPathSelectionList
        contentTypes={contentTypes}
        contentTypePreviewPathSelections={contentTypePreviewPathSelections}
        dispatch={dispatch}
      />
    </Box>
  );
};
