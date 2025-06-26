import {
  AppExtensionSDK,
  locations,
  SidebarExtensionSDK,
  DialogExtensionSDK,
} from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Sidebar } from './locations/Sidebar';
import ConfigScreen from './locations/ConfigScreen';
import FieldSelectDialog from './locations/FieldSelectDialog';
import { useEffect, useState } from 'react';
import { FieldMapping } from './config/klaviyo';
import logger from './utils/logger';

// Map of components by location
const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_DIALOG]: FieldSelectDialog,
};

const App = () => {
  const sdk = useSDK<AppExtensionSDK | SidebarExtensionSDK | DialogExtensionSDK>();
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  // Load existing mappings from installation parameters
  useEffect(() => {
    try {
      if (
        sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR) ||
        sdk.location.is(locations.LOCATION_APP_CONFIG)
      ) {
        const config = sdk.parameters.installation;
        const existingMappings = (config?.mappings as FieldMapping[]) || [];
        setMappings(existingMappings);
      }
    } catch (error) {
      logger.error('Error loading mappings:', error);
    }
  }, [sdk.parameters.installation]);

  // Get the component for the current location
  const getCurrentComponent = () => {
    // Find which location we're in and get the corresponding component
    for (const [location, Component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return <Component mappings={mappings} />;
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
