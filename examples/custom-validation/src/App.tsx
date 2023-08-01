import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import React, { useMemo } from 'react';
import { Field } from './locations/Field';

const ComponentLocationSettings = {
  [locations.LOCATION_ENTRY_FIELD]: Field,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    return ComponentLocationSettings[sdk.location.current];
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
