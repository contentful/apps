import { useContext, useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreen from '@locations/ConfigScreen';
import Dialog from '@locations/Dialog';
import Sidebar from '@locations/Sidebar';
import { SegmentAnalyticsContext } from '@providers/segmentAnalyticsProvider';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
};

const App = () => {
  const sdk = useSDK();
  const { identify } = useContext(SegmentAnalyticsContext);

  const Component = useMemo(() => {
    identify();

    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location, identify]);

  return Component ? <Component /> : null;
};

export default App;
