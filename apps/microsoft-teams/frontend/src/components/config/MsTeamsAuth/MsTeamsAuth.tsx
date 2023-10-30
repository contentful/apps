import { Box, Button, Card, Flex, Subheading } from '@contentful/f36-components';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from '@configs/authConfig';

const MsTeamsAuth = () => {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.log(e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: '/',
      mainWindowRedirectUri: '/',
    });
  };

  return (
    <>
      <AuthenticatedTemplate>
        <Card padding="large">
          <Flex justifyContent="space-between">
            <Flex alignItems="center">
              <Subheading marginBottom="none">{accounts[0]?.name}</Subheading>
            </Flex>
            <Button onClick={() => handleLogout()}>Disconnect</Button>
          </Flex>
        </Card>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Box>
          <Button onClick={() => handleLogin()}>Connect to Teams</Button>
        </Box>
      </UnauthenticatedTemplate>
    </>
  );
};

export default MsTeamsAuth;
