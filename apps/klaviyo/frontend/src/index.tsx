import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { GlobalStyles } from '@contentful/f36-components';
import { init, locations } from '@contentful/app-sdk';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import './global.css';

// Import your components
import ConfigScreen from './locations/ConfigScreen';
import FieldMappingScreen from './locations/FieldMappingScreen';
import { Sidebar } from './locations/Sidebar';
import FieldSelectDialog from './locations/FieldSelectDialog';
import logger from './utils/logger';
import { storeAppDefinitionId } from './services/persistence-service';

const root = document.getElementById('root');

window.addEventListener('message', (event) => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') && window.opener) {
    window.opener.postMessage({
      type: 'oauth:complete',
      code: params.get('code'),
      state: params.get('state'),
    });
    window.close();
  }
});

init((sdk) => {
  logger.log('SDK Location:', sdk.location);
  logger.log('Is config?', sdk.location.is(locations.LOCATION_APP_CONFIG));
  logger.log('Is sidebar?', sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR));

  // Set SDK globally for cross-component access
  (window as any).sdk = sdk;

  // Store app definition ID for later use
  if (sdk.ids && sdk.ids.app) {
    storeAppDefinitionId(sdk.ids.app);
    logger.log('Stored app definition ID:', sdk.ids.app);
  } else {
    logger.warn('App definition ID not available in SDK');
  }

  const ComponentLocation = sdk.location.is(locations.LOCATION_DIALOG)
    ? FieldSelectDialog
    : sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)
    ? Sidebar
    : sdk.location.is(locations.LOCATION_APP_CONFIG)
    ? ConfigScreen
    : sdk.location.is(locations.LOCATION_PAGE)
    ? FieldMappingScreen
    : null;

  if (!ComponentLocation) {
    return;
  }

  const mappings = (sdk as any).parameters?.installation?.fieldMappings || [];
  createRoot(root!).render(
    <BrowserRouter>
      <GlobalStyles />
      <Routes>
        <Route
          path="*"
          element={
            <SDKProvider>
              <ComponentLocation mappings={mappings} />
            </SDKProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
});
