import React from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import ConfigScreen from './locations/ConfigScreen';
import Dialog from './locations/Dialog';
import Field from './locations/Field';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_DIALOG]: Dialog,
};

const queryClient = new QueryClient();

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return (
    <QueryClientProvider client={queryClient}>
      { Component && <Component /> }      
    </QueryClientProvider>
  )
};

export default App;
