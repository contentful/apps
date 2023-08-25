import { Dispatch } from 'react';
import { Box, Flex, Form, Paragraph, Subheading } from '@contentful/f36-components';
import ContentTypeSelection from '../content-type-selection/ContentTypeSelection';
import { Sections } from '../configText';
import { ContentTypeProps } from 'contentful-management';
import NoContentTypesWarning from '../no-content-types-warning/NoContentTypesWarning';
import { ContentTypeReducer } from '../contentTypeReducer';
import { css } from '@emotion/react';

const styles = css({
  width: '100%',
});

interface Props {
  allContentTypes: ContentTypeProps[];
  selectedContentTypes: { [key: string]: boolean };
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
