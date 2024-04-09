import { Box, Heading, Paragraph } from '@contentful/f36-components';
import { ContentType } from '@contentful/app-sdk';
import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { styles } from '@locations/ConfigScreen.styles';
import { AppInstallationParameters } from '@customTypes/configPage';
import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList/ContentTypePreviewPathSelectionList';
import { PreviewPathInfoNote } from './PreviewPathInfoNote/PreviewPathInfoNote';

interface Props {
  parameters: AppInstallationParameters;
  dispatch: Dispatch<ParameterAction>;
  contentTypes: ContentType[];
}

export const ContentTypePreviewPathSection = ({ parameters, dispatch, contentTypes }: Props) => {
  // TO DO: Adjust logic to limit content type duplication of preview path and token
  const { contentTypePreviewPathSelections } = parameters;

  return (
    <Box data-testid="content-type-preview-path-section" className={styles.box}>
      <Heading marginBottom="none" className={styles.heading}>
        Content type and preview path and token
      </Heading>
      <Paragraph marginTop="spacingXs">
        Select applicable content types and define corresponding preview paths and preview tokens.
      </Paragraph>
      <PreviewPathInfoNote />
      <ContentTypePreviewPathSelectionList
        contentTypes={contentTypes}
        contentTypePreviewPathSelections={contentTypePreviewPathSelections}
        dispatch={dispatch}
      />
    </Box>
  );
};
