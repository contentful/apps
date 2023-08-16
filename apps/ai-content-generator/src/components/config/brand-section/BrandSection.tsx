import { Dispatch } from 'react';
import { Box, Flex, Form, Paragraph, Subheading } from '@contentful/f36-components';
import Profile from '../profile/Profile';
import { Sections } from '../configText';
import { ParameterReducer } from '../parameterReducer';
import { css } from '@emotion/react';

export const styles = css({
  width: '100%',
});

interface Props {
  profile: { [key: string]: string };
  dispatch: Dispatch<ParameterReducer>;
}

const BrandSection = (props: Props) => {
  const { profile, dispatch } = props;

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.brandHeading}</Subheading>
      <Paragraph>{Sections.brandDescription}</Paragraph>
      <Box css={styles}>
        <Form>
          <Profile profile={profile} dispatch={dispatch} />
        </Form>
      </Box>
    </Flex>
  );
};

export default BrandSection;
