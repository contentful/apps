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
import { useContext, useEffect } from 'react';
import { SegmentAnalyticsContext } from '@providers/segmentAnalyticsProvider';
import { SegmentEvents } from '@configs/segment/segmentEvent';

const Sidebar = () => {
  useAutoResizer();

  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();
  const { trackEvent } = useContext(SegmentAnalyticsContext);
  const { key, model, profile } = sdk.parameters.installation;

  useEffect(() => {
    trackEvent(SegmentEvents.SIDEBAR_RENDERED);
  }, [trackEvent]);

  if (!key || !model) {
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
      {!profile ? (
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
