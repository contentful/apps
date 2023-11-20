import { Note as F36Note, Flex, TextLink } from '@contentful/forma-36-react-components';

const Note = () => {
  return (
    <Flex marginBottom="spacing2Xl">
      <F36Note noteType="negative">
        Gatsby Cloud will be deprecated on <strong>November 30th.</strong> The Contentful Gatsby app
        will continue to function until then, but we recommend migrating to{' '}
        <TextLink icon={'ExternalLink'} href="https://www.contentful.com/marketplace/app/netlify/">
          Netlfiy Cloud
        </TextLink>{' '}
        as soon as possible.
      </F36Note>
    </Flex>
  );
};

export default Note;
