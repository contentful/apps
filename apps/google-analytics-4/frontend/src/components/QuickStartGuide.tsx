import {
  Button,
  Heading,
  Flex,
  Note,
  Paragraph,
  TextLink,
  Stack,
} from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const styles = {
  credentialsNote: css({
    marginBottom: tokens.spacingM,
  }),
  sectionHeading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacingXs,
    marginTop: tokens.spacingXs,
  }),
  sectionSubHeading: css({
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacing2Xs,
    marginTop: tokens.spacingXl,
  }),
};

const QuickStartGuide = () => {
  return (
    <>
      <Heading as="h3" className={styles.sectionHeading}>
        Configuring a Service Account in Google Cloud
      </Heading>
      <Paragraph>
        To use the Google Analytics app, you will need to provision a{' '}
        <TextLink
          icon={<ExternalLinkTrimmedIcon />}
          alignIcon="end"
          href="https://cloud.google.com/iam/docs/understanding-service-accounts"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Cloud service account
        </TextLink>{' '}
        for which you enable <i>read access</i> to your organization's Google Analytics data.
      </Paragraph>
      <Paragraph>
        If you feel confident setting up a service account manually, we recommend following{' '}
        <TextLink
          icon={<ExternalLinkTrimmedIcon />}
          alignIcon="end"
          href="https://cloud.google.com/iam/docs/understanding-service-accounts"
          target="_blank"
          rel="noopener noreferrer"
        >
          this detailed guide
        </TextLink>{' '}
        . Otherwise, you can follow the automated Quickstart process outlined below.
      </Paragraph>
      <Heading as="h3" className={styles.sectionSubHeading}>
        Quickstart (Recommended)
      </Heading>
      <Note variant="warning" className={styles.credentialsNote}>
        The Quickstart process requires you to be logged in to an existing Google account &mdash; a
        private session will not work.
      </Note>
      <Paragraph>
        This automated flow will guide you through the steps of creating a new Google Cloud Platform
        project, enabling the Google Analytics Data API, creating a service account, and downloading
        correct credentials.
      </Paragraph>
      <Paragraph>
        When you're finished, copy and paste the contents of the downloaded credentials in the field
        below.
      </Paragraph>
      <Paragraph>
        <Stack>
          <Flex style={{ width: '300px' }} marginTop="spacingM" justifyContent="center">
            <Button
              isFullWidth
              size="medium"
              variant="primary"
              endIcon={<ExternalLinkTrimmedIcon />}
              onClick={() => {
                window.open(
                  'https://console.developers.google.com/henhouse/?pb=%5B%22hh-0%22%2C%22analyticsdata.googleapis.com%22%2Cnull%2C%5B%5D%2C%22https%3A%2F%2Fdevelopers.google.com%22%2Cnull%2C%5B%5D%2Cnull%2C%22Enable%20the%20Google%20Analytics%20Data%20API%20v1%22%2C3%2Cnull%2C%5B%5D%2Cfalse%2Cfalse%2Cnull%2Cnull%2Cnull%2Cnull%2Cfalse%2Cnull%2Cfalse%2Cfalse%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%22Quickstart%22%2Ctrue%2C%22Quickstart%22%2Cnull%2Cnull%2Cfalse%5D',
                  '_blank',
                  'width=600,height=300,top=50,left=50,noreferrer'
                );
              }}
            >
              Configure New Service Account&nbsp;
            </Button>
          </Flex>
        </Stack>
      </Paragraph>
    </>
  );
};

export default QuickStartGuide;
