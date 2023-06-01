import { Box, Note, Paragraph, Stack, TextLink } from '@contentful/f36-components';

interface Props {
  error: Error;
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong';

const ErrorDisplay = (props: Props) => {
  const { error } = props;

  // if error message starts with HTTP response status code, show that, otherwise show default
  const hasStatusCode = error.message?.match(/^[0-9]/);
  const message = hasStatusCode ? error.message : DEFAULT_ERROR_MESSAGE;

  return (
    <Note variant="warning">
      <Box>
        <Paragraph>{message}. Please try again later.</Paragraph>
        <Stack>
          <TextLink onClick={() => window.location.reload()}>Reload page</TextLink>
          <TextLink
            href="https://www.contentful.com/support/?utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help"
            target="_blank"
            rel="noopener noreferrer">
            Contact support
          </TextLink>
        </Stack>
      </Box>
    </Note>
  );
};

export default ErrorDisplay;
