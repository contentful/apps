import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreen from '@/components/locations/ConfigScreen';
import Page from '@/components/locations/Page';
import Sidebar from '@/components/locations/Sidebar';

const componentByLocation = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
};

export default function App() {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(componentByLocation)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }

    return null;
  }, [sdk.location]);

  return Component ? <Component /> : null;
}
