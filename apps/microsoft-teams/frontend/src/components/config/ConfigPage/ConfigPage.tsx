import { Box, Heading, Paragraph } from '@contentful/f36-components';
import { styles } from './ConfigPage.styles';
import AuthProvider from '@components/config/AuthProvider/AuthProvider';
import ConnectToTeams from '@components/config/ConnectToTeams/ConnectToTeams';

const ConfigPage = () => {
  return (
    <Box className={styles.body}>
      <Heading>Set up Microsoft Teams</Heading>
      <Paragraph>
        The Microsoft Teams app for Contentful lets you set up automatic notifications about
        specific Contentful events so that you can quickly notify collaborators about changes
        throughout the content lifecycle.
      </Paragraph>
      <hr className={styles.splitter} />
      <AuthProvider>
        <ConnectToTeams />
      </AuthProvider>
    </Box>
  );
};

export default ConfigPage;
