import { Box, Paragraph, Subheading } from '@contentful/f36-components';
import MsTeamsAuth from '@components/config/MsTeamsAuth/MsTeamsAuth';

const ConnectToTeams = () => {
  return (
    <Box>
      <Subheading>Configure your Teams account</Subheading>
      <Paragraph>Sign into Microsoft Teams in order to connect your account.</Paragraph>
      <MsTeamsAuth />
    </Box>
  );
};

export default ConnectToTeams;
