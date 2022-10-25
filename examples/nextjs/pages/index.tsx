import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from '@/components/locations/ConfigScreen';
import Field from '@/components/locations/Field';
import EntryEditor from '@/components/locations/EntryEditor';
import Dialog from '@/components/locations/Dialog';
import Sidebar from '@/components/locations/Sidebar';
import Page from '@/components/locations/Page';
import Home from '@/components/locations/Home';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_PAGE]: Home,
};

const App = () => {
  const sdk = useSDK();

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
