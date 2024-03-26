import { Box, Heading, Paragraph } from '@contentful/f36-components';
import { Dispatch, SetStateAction } from 'react';

import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList/ContentTypePreviewPathSelectionList';
import { styles } from '../ConfigScreen.styles';
import { AppInstallationParameters } from '../../../types';

interface Props {
  parameters: AppInstallationParameters;
  dispatchParameters: Dispatch<SetStateAction<any>>;
}

export const ContentTypePreviewPathSection = ({ parameters, dispatchParameters }: Props) => {
  // TO DO: Adjust logic to limit content type duplication of preview path and token
  const { contentTypes, contentTypePreviewPathSelections } = parameters;
  return (
    <Box className={styles.box}>
      <Heading marginBottom="none" className={styles.heading}>
        Content type and preview path and token
      </Heading>
      <Paragraph marginTop="spacingXs">
        Select applicable content types and define corresponding preview paths and preview tokens.
      </Paragraph>
      <ContentTypePreviewPathSelectionList
        contentTypes={contentTypes}
        contentTypePreviewPathSelections={contentTypePreviewPathSelections}
        dispatchParameters={dispatchParameters}
      />
    </Box>
  );
};
