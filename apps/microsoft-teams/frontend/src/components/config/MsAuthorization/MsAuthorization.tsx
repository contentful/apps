import { Box, Button, Card, Flex, Paragraph, Subheading } from '@contentful/f36-components';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from '@configs/authConfig';
import { accessSection } from '@constants/configCopy';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { HyperLink } from '@contentful/integration-frontend-toolkit/components';
import { styles } from './MsAuthorization.styles';

const MsAuthorization = () => {
  const { instance, accounts } = useMsal();
  const { logout, login, teamsAppInfo, teamsAppLink, description } = accessSection;

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

  console.log({ accounts });

  return (
    <>
      <AuthenticatedTemplate>
        <Card padding="large">
          <Flex justifyContent="space-between">
            <Flex flexDirection="column">
              <Subheading marginBottom="none">{accounts[0]?.name}</Subheading>
              <Paragraph marginBottom="none">{accounts[0]?.username}</Paragraph>
            </Flex>
            <Button onClick={() => handleLogout()}>{logout}</Button>
          </Flex>
        </Card>
        <Flex
          marginBottom="spacingS"
          marginTop="spacingS"
          alignItems="center"
          className={styles.logo}>
          <TeamsLogo />
          <Box marginLeft="spacingXs">
            <HyperLink
              body={teamsAppInfo}
              substring={teamsAppLink}
              // TODO: update link to app documentation
              href={'https://www.contentful.com/help/apps-at-contentful/'}
            />
          </Box>
        </Flex>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Paragraph>{description}</Paragraph>
        <Box>
          <Button onClick={() => handleLogin()}>{login}</Button>
        </Box>
      </UnauthenticatedTemplate>
    </>
  );
};

export default MsAuthorization;
