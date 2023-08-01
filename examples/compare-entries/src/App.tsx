import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import Dialog from './locations/Dialog';
import Sidebar from './locations/Sidebar';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    return ComponentLocationSettings[sdk.location.current];
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
