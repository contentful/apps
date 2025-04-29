import React from 'react';
import { render } from 'react-dom';
import { GlobalStyles } from '@contentful/f36-components';
import { init, locations } from '@contentful/app-sdk';
import { AppExtensionSDK, DialogExtensionSDK } from '@contentful/app-sdk';

// Import your components
import ConfigScreen from './locations/ConfigScreen';
import FieldMappingScreen from './locations/FieldMappingScreen';
import FieldMapper from './components/FieldMapper';
import { KlaviyoAppProvider } from './context/KlaviyoAppContext';
import { Sidebar } from './locations/Sidebar';
import FieldSelectDialog from './locations/FieldSelectDialog';
// Create a simple context for SDK
import { createContext } from 'react';

// Create your own SDK context
export const SDKContext = createContext<any>(null);

// Create a provider component
const SDKContextProvider = ({ children, sdk }: { children: React.ReactNode; sdk: any }) => (
  <SDKContext.Provider value={sdk}>{children}</SDKContext.Provider>
);

const root = document.getElementById('root');

// Update the message event listener in index.tsx
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'updateFieldMappings') {
    console.log('Received field mapping update:', event.data.fieldMappings);

    // If we're in development mode, save to localStorage for testing
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('dev_field_mappings', JSON.stringify(event.data.fieldMappings));
      console.log('Saved field mappings to localStorage for dev mode');
    }

    // If we have access to the global SDK object, try to save using it
    try {
      const globalSdk = (window as any).sdk;
      if (globalSdk && globalSdk.app && typeof globalSdk.app.setParameters === 'function') {
        const currentParams = globalSdk.parameters?.installation || {};

        await globalSdk.app.setParameters({
          installation: {
            ...currentParams,
            fieldMappings: event.data.fieldMappings,
          },
        });

        console.log('Updated field mappings in installation parameters');
      }
    } catch (error) {
      console.error('Failed to update field mappings in installation parameters:', error);
    }
  }
});

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // Try to get any saved field mappings from localStorage
  const savedMappings = localStorage.getItem('dev_field_mappings');
  const fieldMappings = savedMappings ? JSON.parse(savedMappings) : [];

  // Create a mock SDK for development
  const mockSdk: any = {
    app: {
      onConfigure: () => Promise.resolve({}),
      getParameters: () => ({
        fieldMappings,
      }),
      setParameters: (params: any) => {
        console.log('Setting parameters in dev mode:', params);
        if (params.installation && params.installation.fieldMappings) {
          localStorage.setItem(
            'dev_field_mappings',
            JSON.stringify(params.installation.fieldMappings)
          );
        }
        return Promise.resolve();
      },
      setReady: () => {},
    },
    ids: {
      app: 'klaviyo-app',
      space: 'space-id',
      environment: 'environment-id',
      user: 'user-id',
    },
    location: {
      is: () => true,
    },
    parameters: {
      installation: {
        fieldMappings,
      },
    },
    notifier: {
      success: (message: string) => console.log(`Success: ${message}`),
      error: (message: string) => console.error(`Error: ${message}`),
    },
    window: {
      startAutoResizer: () => {},
    },
    // Add CMA for ContentTypes
    cma: {
      space: {
        get: () => Promise.resolve({ sys: { id: 'space-id' } }),
      },
      environment: {
        get: () => Promise.resolve({ sys: { id: 'environment-id' } }),
      },
      contentType: {
        getMany: () => Promise.resolve({ items: [] }),
      },
    },
  };

  // Make the SDK available globally for development
  (window as any).sdk = mockSdk;

  render(
    <SDKContextProvider sdk={mockSdk}>
      <GlobalStyles />
      <KlaviyoAppProvider>
        <ConfigScreen />
      </KlaviyoAppProvider>
    </SDKContextProvider>,
    root
  );
} else {
  // Production init
  init((sdk) => {
    console.log('SDK Location:', sdk.location);
    console.log('Is config?', sdk.location.is(locations.LOCATION_APP_CONFIG));
    console.log('Is sidebar?', sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR));

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

    const entry = (sdk as any).entry || {};
    const mappings = (sdk as any).parameters?.installation?.fieldMappings || [];
    render(
      <SDKContextProvider sdk={sdk}>
        <GlobalStyles />
        <ComponentLocation entry={entry} mappings={mappings} />
      </SDKContextProvider>,
      root
    );
  });
}
