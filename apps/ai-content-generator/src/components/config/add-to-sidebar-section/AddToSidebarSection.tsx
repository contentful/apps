import { Dispatch } from 'react';
import { Box, Flex, Form, Paragraph, Subheading } from '@contentful/f36-components';
import { css } from '@emotion/react';
import { ContentTypeProps } from 'contentful-management';
import { Sections } from '@components/config/configText';
import ContentTypeSelection from '@components/config/content-type-selection/ContentTypeSelection';
import NoContentTypesWarning from '@components/config/no-content-types-warning/NoContentTypesWarning';
import { ContentTypeReducer } from '@components/config/contentTypeReducer';

const styles = css({
  width: '100%',
});

interface Props {
  allContentTypes: ContentTypeProps[];
  selectedContentTypes: string[];
  dispatch: Dispatch<ContentTypeReducer>;
}

const AddToSidebarSection = (props: Props) => {
  const { allContentTypes, selectedContentTypes, dispatch } = props;

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.addToSidebarHeading}</Subheading>
      <Paragraph>{Sections.addToSidebarDescription}</Paragraph>
      <Box css={styles}>
        {allContentTypes.length ? (
          <Form>
            <ContentTypeSelection
              allContentTypes={allContentTypes}
              selectedContentTypes={selectedContentTypes}
              dispatch={dispatch}
            />
          </Form>
        ) : (
          <NoContentTypesWarning />
        )}
      </Box>
    </Flex>
  );
};

export default AddToSidebarSection;
