import { Note, Paragraph, TextLink } from '@contentful/f36-components';

const LocalHostWarning = () => (
  <Note variant="warning" style={{ margin: '20px' }}>
    <Paragraph>
      This app is running in development mode. To use it, open it inside the{' '}
      <TextLink
        href="https://app.contentful.com"
        target="_blank"
        rel="noopener noreferrer">
        Contentful web app
      </TextLink>{' '}
      with the app definition pointing to{' '}
      <strong>http://localhost:3000</strong>.
    </Paragraph>
  </Note>
);

export default LocalHostWarning;
