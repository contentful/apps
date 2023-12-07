import { Box, Flex, Subheading } from '@contentful/f36-components';
import { HyperLink } from '@contentful/integration-component-library';
import { styles } from './EmptyState.styles';

interface Props {
  image: JSX.Element;
  heading: string;
  body: string;
  linkSubstring: string;
  linkHref: string;
}

const EmptyState = (props: Props) => {
  const { image, heading, body, linkSubstring, linkHref } = props;

  return (
    <Flex flexDirection="column" alignItems="center">
      {image}
      <Subheading>{heading}</Subheading>
      <Box className={styles.emptyContent}>
        <HyperLink body={body} substring={linkSubstring} href={linkHref} />
      </Box>
    </Flex>
  );
};

export default EmptyState;
