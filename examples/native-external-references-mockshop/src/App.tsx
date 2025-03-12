import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import ConfigScreen from './locations/ConfigScreen';

// Map app locations to components
const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
};

const App = () => {
  const sdk = useSDK();

  // Get the component for the current location
  // Return a empty component if the location is not defined
  const [, Component = () => null] = useMemo(
    () =>
      Object.entries(ComponentLocationSettings).find(([locationKey]) =>
        sdk.location.is(locationKey)
      ) ?? [],
    [sdk.location]
  );

  return <Component />;
};

export default App;
