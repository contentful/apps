import { Dispatch } from 'react';
import { Box, Button, Flex, ModalLauncher, Paragraph } from '@contentful/f36-components';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@configs/authConfig';
import { accessSection } from '@constants/configCopy';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { HyperLink } from '@contentful/integration-frontend-toolkit/components';
import { styles } from './AccessSection.styles';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import { useCustomApi } from '@hooks/useCustomApi';
import { AppInstallationParameters } from '@customTypes/configPage';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import DisconnectModal from '@components/config/DisconnectModal/DisconnectModal';
import { displayConfirmationNotifications } from '@helpers/configHelpers';
import MsGraph from '@utils/msGraphApi';
import { AccountInfo } from '@azure/msal-browser';
import AccessSectionCard from '@components/config/AccessSectionCard/AccessSectionCard';

interface Props {
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
  isAppInstalled: boolean;
}

const defaultOrgDetails = {
  orgName: '',
  orgLogo: '',
};

const AccessSection = (props: Props) => {
  const { dispatch, parameters, isAppInstalled } = props;

  // A hook that returns the PublicClientApplication instance from MSAL to see if there is an authenticated account
  const { instance, accounts, inProgress } = useMsal();
  const customApi = useCustomApi();
  const sdk = useSDK<ConfigAppSDK>();

  const loginInProgress = inProgress === 'login';
  const logoutInProgress = inProgress === 'logout';
  const { login, teamsAppInfo, teamsAppLink, description, authError, orgDetailsError } =
    accessSection;

  const handleLogin = async () => {
    try {
      const authResult = await instance.loginPopup(loginRequest);
      const { tenantId, account } = authResult;

      const orgDetails = await getOrgDetails(account);
      const msAccountInfo: Omit<AppInstallationParameters, 'notifications'> = {
        tenantId,
        authenticatedUsername: account.username,
        ...orgDetails,
      };

      // TODO: remove this conditional when we get the new saveConfiguration updated
      if (!isAppInstalled) {
        await customApi.saveConfiguration({
          ...parameters,
          ...msAccountInfo,
        });
      }
      dispatch({
        type: actions.UPDATE_MS_ACCOUNT_INFO,
        payload: msAccountInfo,
      });

      if (isAppInstalled && authResult.tenantId !== parameters.tenantId) {
        displayConfirmationNotifications(
          sdk,
          accessSection.updateConfirmation,
          accessSection.saveWarning
        );
      }
    } catch (e) {
      sdk.notifier.error(authError);
      console.error(e);
    }
  };

  const handleLogout = () => {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <DisconnectModal
          isShown={isShown}
          handleCancel={() => {
            onClose(true);
          }}
          handleDisconnect={async () => {
            onClose(true);
            await instance.logoutPopup({
              postLogoutRedirectUri: '/',
              account: accounts[0],
            });
            const msAccountInfo: Omit<AppInstallationParameters, 'notifications'> = {
              tenantId: '',
              authenticatedUsername: '',
              ...defaultOrgDetails,
            };
            dispatch({
              type: actions.UPDATE_MS_ACCOUNT_INFO,
              payload: msAccountInfo,
            });
          }}
        />
      );
    });
  };

  const getOrgDetails = async (account: AccountInfo): Promise<typeof defaultOrgDetails> => {
    let orgDetails = defaultOrgDetails;
    try {
      const msGraph = new MsGraph(instance, account);
      const [orgName, orgLogo] = await Promise.all([
        msGraph.getOrganizationDisplayName(),
        msGraph.getOrganizationLogo(),
      ]);
      orgDetails = { orgName, orgLogo };
    } catch (e) {
      sdk.notifier.error(orgDetailsError);
      console.error(e);
    }

    return orgDetails;
  };

  const accessComponent = () => {
    // Display if not authorized and if logout is not in progress
    if (!parameters.tenantId && inProgress !== 'logout') {
      return (
        <>
          <Paragraph>{description}</Paragraph>
          <Button
            onClick={() => handleLogin()}
            isDisabled={loginInProgress}
            isLoading={loginInProgress}>
            {login}
          </Button>
        </>
      );
    }

    return (
      <>
        <AccessSectionCard
          parameters={parameters}
          loginInProgress={loginInProgress}
          logoutInProgress={logoutInProgress}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
        />
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
      </>
    );
  };

  return accessComponent();
};

export default AccessSection;
