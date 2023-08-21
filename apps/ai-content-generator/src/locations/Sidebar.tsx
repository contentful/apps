import { useAutoResizer } from '@contentful/react-apps-toolkit';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box } from '@contentful/f36-components';
import SidebarButtons from '@components/app/sidebar/SidebarButtons';
import ParametersMissingWarning from '@components/app/sidebar/ParametersMissingWarning';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { styles } from './Sidebar.styles';
import { warningMessages, disclaimerMessage } from '@components/app/sidebar/sidebarText';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const Sidebar = () => {
  useAutoResizer();

  const sdk = useSDK<SidebarAppSDK>();
  const { apiKey, model, profile } = sdk.parameters.installation as AppInstallationParameters;

  if (!apiKey || !model) {
    return (
      <ParametersMissingWarning
        message={warningMessages.paramsMissing}
        linkSubstring={warningMessages.linkSubstring}
      />
    );
  }

  return (
    <>
      <SidebarButtons />
      {!profile?.profile ? (
        <Box css={styles.msgWrapper}>
          <ParametersMissingWarning
            message={warningMessages.profileMissing}
            linkSubstring={warningMessages.linkSubstring}
          />
        </Box>
      ) : null}
      <Box css={styles.msgWrapper}>
        <HyperLink
          body={disclaimerMessage.body}
          substring={disclaimerMessage.substring}
          hyperLinkHref={disclaimerMessage.link}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </Box>
    </>
  );
};

export default Sidebar;
