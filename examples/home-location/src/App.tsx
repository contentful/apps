import React from 'react';
import Home from './locations/Home';
import { useSDK } from '@contentful/react-apps-toolkit';
import { locations } from '@contentful/app-sdk';

const App = () => {
  const sdk = useSDK();

  if (sdk.location.is(locations.LOCATION_HOME)) {
    return <Home />;
  }

  return null;
};

export default App;
