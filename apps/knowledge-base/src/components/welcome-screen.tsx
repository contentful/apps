import * as React from 'react';
import {
  Heading,
  Paragraph,
  List,
  ListItem,
  Note,
  TextLink,
  CheckboxField,
  Typography,
} from '@contentful/forma-36-react-components';
import styled from '@emotion/styled';
import Layout from '~/templates/layout';
import Section from './section';
import appScreenShot from '~/assets/hc-screeshot.png';

const Container = styled.div`
  display: grid;
  grid-template-columns: 460px auto;
  column-gap: 30px;

  color: #536171;
  font-size: 14px;
`;

const Screenshot = styled.img`
  max-width: 100%;
  height: auto;
`;

const Text = styled(Paragraph)`
  margin-bottom: 36px;
`;

const InstallNowText = styled(Paragraph)`
  margin-top: 8px;
`;

interface WelcomeScreenProps {
  termsAccepted: boolean;
  setTermsAccepted(boolean);
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  termsAccepted,
  setTermsAccepted,
}) => {
  return (
    <Layout>
      <Section isEnabled={true}>
        <Typography>
          <Heading>A knowledge base that&apos;s ready to use</Heading>
        </Typography>

        <Container>
          <div>
            <Text>
              With this app you can create and deploy a knowledge base for your
              support team. We&apos;ve prepared the foundation, so you can get
              started.
            </Text>

            <Paragraph>What this means for you:</Paragraph>

            <List>
              <ListItem>
                No coding neccessary -- just install and start adding content.
              </ListItem>
              <ListItem>
                Get up and running with a predefined content model specifically
                for a knowledge base.
              </ListItem>
              <ListItem>
                No need to set up a website -- you can customize the one
                included with the app.
              </ListItem>
              <ListItem>
                Preview and publish content before going live.
              </ListItem>
            </List>
          </div>

          <div>
            <Screenshot
              src={appScreenShot}
              alt="A screeshot of the Knowledge Base Website after installing this app"
            />
          </div>
        </Container>
      </Section>

      <Note>
        <Paragraph>
          To install this app, you need to accept the{' '}
          <TextLink target="blank" href="https://forms.gle/SuV276jagXF6e2DM7">
            {' '}
            Early Access Program terms.
          </TextLink>
        </Paragraph>
        <CheckboxField
          labelText="I accept the Early Access Program terms."
          checked={termsAccepted}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTermsAccepted(e.target.checked)
          }
          id="terms-checkbox"
        />
      </Note>

      {termsAccepted && (
        <InstallNowText>
          You can now install the app from the top right.
        </InstallNowText>
      )}
    </Layout>
  );
};

export default WelcomeScreen;
