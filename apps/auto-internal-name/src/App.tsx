import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import React, { useEffect, useState } from 'react';
import ConfigScreen from './locations/ConfigScreen';
import Field from './locations/Field';
import { AppInstallationParameters } from './utils/types';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
};

const App = () => {
  const sdk = useSDK();
  const [installationParameters, setInstallationParameters] = useState<AppInstallationParameters>({
    separator: '',
    sourceFieldId: '',
    overrides: [],
  });

  // Load installation parameters and react to changes
  useEffect(() => {
    try {
      if (
        sdk.location.is(locations.LOCATION_ENTRY_FIELD) ||
        sdk.location.is(locations.LOCATION_APP_CONFIG)
      ) {
        const config = sdk.parameters.installation as AppInstallationParameters;
        if (config) {
          setInstallationParameters(config);
        }
      }
    } catch (error) {
      console.error('Error loading installation parameters:', error);
    }
  }, [sdk.parameters.installation, sdk.location]);

  const getCurrentComponent = () => {
    for (const [location, Component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        if (location === locations.LOCATION_ENTRY_FIELD) {
          return <Field installationParameters={installationParameters} />;
        }

        const ComponentToRender = Component as React.ComponentType;
        return <ComponentToRender />;
      }
    }
    return null;
  };

  return (
    <>
      {/* Render the component for the current Contentful location */}
      {getCurrentComponent()}
    </>
  );
};

export default App;
