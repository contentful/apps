import { useEffect, useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreenV1 from './locations/ConfigScreenV1';
import ConfigScreen from '@locations/ConfigScreen';
import DialogV1 from './locations/DialogV1';
import Dialog from '@locations/Dialog';
import EntryEditor from '@locations/EntryEditor';
import Field from '@locations/Field';
import Page from '@locations/Page';
import SidebarV1 from './locations/SidebarV1';
import Sidebar from '@locations/Sidebar';
import Home from '@locations/Home';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { ldConfigType } from '@configs/launch-darkly/ldConfig';

const ComponentLocationSettings = (isV1: boolean) => ({
  [locations.LOCATION_APP_CONFIG]: isV1 ? ConfigScreenV1 : ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: isV1 ? DialogV1 : Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: isV1 ? SidebarV1 : Sidebar,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_HOME]: Home,
});

const App = () => {
  const sdk = useSDK();
  const { integrationsAiContentGeneratorV1: isV1 } = useFlags<ldConfigType>();
  const ldClient = useLDClient();

  useEffect(() => {
    ldClient?.identify({
      key: sdk.user.sys.id,
      custom: {
        currentSpaceId: sdk.ids.space,
      },
    });
  }, [ldClient]);

  const Component = useMemo(() => {
    const locations = ComponentLocationSettings(isV1);

    for (const [location, component] of Object.entries(locations)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location, isV1]);

  return Component ? <Component /> : null;
};

export default App;
