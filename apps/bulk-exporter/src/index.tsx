import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SDKProvider, useSDK } from '@contentful/react-apps-toolkit';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import Page from './locations/Page';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <StrictMode>
    <SDKProvider>
      <AppRouter />
    </SDKProvider>
  </StrictMode>
);

function AppRouter() {
  const sdk = useSDK();

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return <ConfigScreen />;
  }

  if (sdk.location.is(locations.LOCATION_PAGE)) {
    return <Page />;
  }

  return null;
}
