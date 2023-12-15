import { useContext, useEffect, useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreenV1 from './locations/ConfigScreenV1';
import ConfigScreen from '@locations/ConfigScreen';
import Dialog from '@locations/Dialog';
import SidebarV1 from './locations/SidebarV1';
import Sidebar from '@locations/Sidebar';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { ldConfigType } from '@configs/launch-darkly/ldConfig';
import { SegmentAnalyticsContext } from '@providers/segmentAnalyticsProvider';

const ComponentLocationSettings = (isV2: boolean) => ({
  [locations.LOCATION_APP_CONFIG]: isV2 ? ConfigScreen : ConfigScreenV1,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: isV2 ? Sidebar : SidebarV1,
});

const App = () => {
  const sdk = useSDK();
  const { identify } = useContext(SegmentAnalyticsContext);
  const { integrationsAiContentGeneratorV2: isV2 } = useFlags<ldConfigType>();
  const ldClient = useLDClient();

  useEffect(() => {
    ldClient?.identify({
      key: sdk.user.sys.id,
      custom: {
        currentSpaceId: sdk.ids.space,
      },
    });
  }, [ldClient, sdk.ids.space, sdk.user.sys.id]);

  const Component = useMemo(() => {
    const locations = ComponentLocationSettings(isV2);
    identify();

    for (const [location, component] of Object.entries(locations)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location, isV2, identify]);

  return Component ? <Component /> : null;
};

export default App;
