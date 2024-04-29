import { Dispatch, useContext, useEffect, useState } from 'react';
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
import MsGraph from '@utils/msGraphApi';
import { AccountInfo } from '@azure/msal-browser';
import AccessSectionCard from '@components/config/AccessSectionCard/AccessSectionCard';
import {
  SegmentAnalyticsContext,
  ConfigAction,
} from '@contentful/integration-frontend-toolkit/sdks';

interface Props {
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
}

const defaultOrgDetails = {
  orgName: '',
  orgLogo: '',
};

const AccessSection = (props: Props) => {
  const { dispatch, parameters } = props;
  const [hasUpdatedMsAuth, setHasUpdatedMsAuth] = useState<boolean>(false);
  const [hasUpdatedOrgDetails, setHasUpdatedOrgDetails] = useState<boolean>(false);
  const [hasDisconnected, setHasDisconnected] = useState<boolean>(false);
  const [updatedMsAccountInfo, setUpdatedMsAccountInfo] =
    useState<Omit<AppInstallationParameters, 'notifications'>>(parameters);

  // A hook that returns the PublicClientApplication instance from MSAL to see if there is an authenticated account
  const { instance, accounts, inProgress } = useMsal();
  const customApi = useCustomApi();
  const sdk = useSDK<ConfigAppSDK>();
  const { trackEvent } = useContext(SegmentAnalyticsContext);
  const trackingEventInfo = {
    environment_key: sdk.ids.environment,
    space_key: sdk.ids.space,
    organization_key: sdk.ids.organization,
    app_key: sdk.ids.app,
    app_name: 'microsoft-teams',
  };

  const loginInProgress = inProgress === 'login';
  const logoutInProgress = inProgress === 'logout';
  const { login, teamsAppInfo, teamsAppLink, description, authError, orgDetailsError } =
    accessSection;

  // saves the app config page after dispatch completes and parameters are updated
  const saveMsAccountInfo = async () => {
    await customApi.saveConfiguration();
    setHasUpdatedMsAuth(false);
    setHasUpdatedOrgDetails(false);
    setHasDisconnected(false);
    setUpdatedMsAccountInfo(parameters);
  };

  useEffect(() => {
    // for initial login and auth changes
    if (
      parameters.tenantId &&
      parameters.tenantId === updatedMsAccountInfo.tenantId &&
      hasUpdatedMsAuth
    ) {
      saveMsAccountInfo();
    }

    // for when a user disconnects
    if (
      !parameters.tenantId &&
      parameters.tenantId === updatedMsAccountInfo.tenantId &&
      hasDisconnected
    ) {
      saveMsAccountInfo();
    }
  }, [parameters.tenantId]);

  useEffect(() => {
    // for when there are updated orgDetails
    if (
      (parameters.orgName === updatedMsAccountInfo.orgName ||
        parameters.orgLogo === updatedMsAccountInfo.orgLogo) &&
      hasUpdatedOrgDetails
    ) {
      saveMsAccountInfo();
    }
  }, [parameters.orgName, parameters.orgLogo]);

  const handleLogin = async () => {
    try {
      const authResult = await instance.loginPopup(loginRequest);
      const { tenantId, account } = authResult;
      setHasUpdatedMsAuth(true);
      setUpdatedMsAccountInfo({
        ...updatedMsAccountInfo,
        tenantId,
        authenticatedUsername: account.username,
      });

      const orgDetails = await getOrgDetails(account);
      const msAccountInfo: Omit<AppInstallationParameters, 'notifications'> = {
        tenantId,
        authenticatedUsername: account.username,
        ...orgDetails,
      };

      dispatch({
        type: actions.UPDATE_MS_ACCOUNT_INFO,
        payload: msAccountInfo,
      });

      trackEvent('configSaved', {
        action: ConfigAction.Installed,
        metaData: {
          tenantId,
        },
        ...trackingEventInfo,
      });
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

            trackEvent('configSaved', {
              action: ConfigAction.Cancelled,
              metaData: {
                tenantId: parameters.tenantId,
              },
              ...trackingEventInfo,
            });
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
            setUpdatedMsAccountInfo(msAccountInfo);

            dispatch({
              type: actions.UPDATE_MS_ACCOUNT_INFO,
              payload: msAccountInfo,
            });

            trackEvent('configSaved', {
              action: ConfigAction.Updated,
              metaData: {
                tenantId: msAccountInfo.tenantId,
              },
              ...trackingEventInfo,
            });

            setHasDisconnected(true);
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

      setHasUpdatedOrgDetails(true);
      setUpdatedMsAccountInfo({ ...updatedMsAccountInfo, orgName, orgLogo });
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
