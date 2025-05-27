import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from '@contentful/f36-components';
import { init, locations } from '@contentful/app-sdk';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import './global.css';
import Callback from './pages/auth/callback';
import App from './App';

// Import your components
import ConfigScreen from './locations/ConfigScreen';
import FieldMappingScreen from './locations/FieldMappingScreen';
import { Sidebar } from './locations/Sidebar';
import FieldSelectDialog from './locations/FieldSelectDialog';
import logger from './utils/logger';
import { storeAppDefinitionId, getAppDefinitionId } from './services/persistence-service';
import { getGlobalSDK } from './utils/sdk-helpers';

const root = document.getElementById('root');

// Update the message event listener in index.tsx
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'updateFieldMappings') {
    try {
      console.log('Received field mapping update event:', event.data);

      // Use our new helper with retry logic
      const globalSdk = await getGlobalSDK();

      // Check if SDK is fully available
      if (!globalSdk) {
        // Store app definition ID if available
        if (event.data.appDefinitionId) {
          storeAppDefinitionId(event.data.appDefinitionId);
        }
        return;
      }

      // Get necessary IDs
      const spaceId = globalSdk.ids.space;
      const environmentId = globalSdk.ids.environment;
      // Use appDefinitionId from event if available, otherwise from SDK or localStorage
      const appDefinitionId =
        event.data.appDefinitionId || globalSdk.ids.app || getAppDefinitionId();

      try {
        // Get current parameters
        const appInstallation = await globalSdk.cma.appInstallation.get({
          appDefinitionId,
          spaceId,
          environmentId,
        });

        const currentParams = appInstallation.parameters || {};

        // Format the mappings if needed
        const fieldMappings = event.data.fieldMappings.map((item: any) => ({
          contentfulFieldId: item.id || item.contentfulFieldId,
          klaviyoBlockName: item.name || item.klaviyoBlockName || item.id || item.contentfulFieldId,
          fieldType:
            item.type === 'RichText' || item.fieldType === 'richText' ? 'richText' : 'text',
          contentTypeId: item.contentTypeId,
        }));

        // Organize mappings by content type
        const contentTypeMappings: Record<string, any[]> = {};
        fieldMappings.forEach((mapping: any) => {
          if (mapping.contentTypeId) {
            if (!contentTypeMappings[mapping.contentTypeId]) {
              contentTypeMappings[mapping.contentTypeId] = [];
            }
            contentTypeMappings[mapping.contentTypeId].push(mapping);
          }
        });

        console.log('Saving field mappings to app parameters:', {
          fieldMappings,
          contentTypeMappings,
          mappingCount: fieldMappings.length,
          contentTypeCount: Object.keys(contentTypeMappings).length,
        });

        // Prepare updated parameters
        const updatedParameters = {
          ...currentParams,
          fieldMappings,
          contentTypeMappings,
          appDefinitionId, // Include appDefinitionId at the top level
          installation: {
            ...(currentParams.installation || {}),
            fieldMappings,
            contentTypeMappings,
            appDefinitionId, // Include appDefinitionId in installation
            mappings: event.data.fieldMappings, // Store original format too
          },
        };

        // Save the parameters to the app using the correct method
        console.log('onConfigure', updatedParameters, globalSdk.app);
        await globalSdk.app.onConfigure();
      } catch (sdkError) {
        console.error('Error saving field mappings via SDK:', sdkError);
      }
    } catch (error) {
      console.error('Error saving field mappings to app parameters:', error);
    }
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
        <Route path="/auth/callback" element={<Callback />} />
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
