import {
  Box,
  Button,
  Heading,
  Paragraph,
  Card,
  Layout,
  Flex,
  Spinner,
} from '@contentful/f36-components';
import { ArrowRightIcon } from '@contentful/f36-icons';
import { OAuthConnector } from './OAuthConnector';

interface GettingStartedPageProps {
  onSelectFile: () => void;
}

export const GettingStartedPage = ({ onSelectFile }: GettingStartedPageProps) => {
  return (
    <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
      <Layout.Body>
        <Box padding="spacing2Xl">
          <Card padding="large" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
              <Flex flexDirection="column" alignItems="flex-start">
                <Heading marginBottom="spacingS">Google Drive Integration</Heading>
                <Paragraph>
                  Create entries using existing content types from a Google Drive file.
                  <br />
                  Get started by selecting the file you would like to use.
                </Paragraph>
              </Flex>

              <Button variant="primary" onClick={onSelectFile} endIcon={<ArrowRightIcon />}>
                Select your file
              </Button>
            </Flex>
            <OAuthConnector />
          </Card>
        </Box>
      </Layout.Body>
    </Layout>
  );
};
