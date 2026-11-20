import { Note, TextLink } from '@contentful/f36-components';

const LocalhostWarning = () => {
  return (
    <div style={{ margin: '20px' }}>
      <Note variant="warning" title="Development Mode">
        This app is running locally. To test it, install it in a Contentful space and access it from
        there.{' '}
        <TextLink
          href="https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/"
          target="_blank"
          rel="noopener noreferrer">
          Learn more about Contentful App development.
        </TextLink>
      </Note>
    </div>
  );
};

export default LocalhostWarning;
