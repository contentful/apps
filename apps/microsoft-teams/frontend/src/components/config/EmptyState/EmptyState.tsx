import { Flex, Subheading } from '@contentful/f36-components';
import { HyperLink } from '@contentful/integration-component-library';

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
      <HyperLink body={body} substring={linkSubstring} href={linkHref} />
    </Flex>
  );
};

export default EmptyState;
