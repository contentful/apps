import { useEffect, useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import Page from './locations/Page/Page';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreen from './locations/ConfigScreen/ConfigScreen';
import { useLDClient } from 'launchdarkly-react-client-sdk';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_PAGE]: Page,
};

const App = () => {
  const sdk = useSDK();
  const ldClient = useLDClient();

  useEffect(() => {
    if (!ldClient) return;
    void ldClient.identify({ kind: 'organization', key: sdk.ids.organization });
  }, [ldClient, sdk.user.sys.id]);

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
