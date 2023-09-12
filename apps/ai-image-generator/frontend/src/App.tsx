import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo } from 'react';
import ConfigScreen from './locations/ConfigScreen';
import Dialog from './locations/Dialog';
import EntryEditor from './locations/EntryEditor';
import Field from './locations/Field';
import Page from './locations/Page';
import Sidebar from './locations/Sidebar';
import Home from './locations/Home';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { launchDarklyConfigType } from './configs/launch-darkly/launchDarklyConfig';
import SegmentClient from 'clients/segmentClient';

const ComponentLocationSettings = (isV2: boolean) => ({
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_HOME]: Home,
});

const App = () => {
  const sdk = useSDK();
  const { aiigFlagV2 } = useFlags<launchDarklyConfigType>();
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
    const locations = ComponentLocationSettings(aiigFlagV2);

    for (const [location, component] of Object.entries(locations)) {
      if (sdk.location.is(location)) {
        // Segment tracking events
        SegmentClient.identify(sdk);
        SegmentClient.trackLocation(sdk, location);

        return component;
      }
    }
  }, [sdk, aiigFlagV2]);

  return Component ? <Component /> : null;
};

export default App;
