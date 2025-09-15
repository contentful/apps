import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreen from './locations/ConfigScreen';
import Sidebar from './locations/Sidebar';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
};

const App = () => {
  console.log('🚀 Amplitude App: Initializing Amplitude integration app');
  
  const sdk = useSDK();
  
  console.log('📍 Amplitude App: Current location detected:', sdk.location);
  console.log('🔧 Amplitude App: Available locations:', Object.keys(ComponentLocationSettings));

  const Component = useMemo(() => {
    console.log('🎯 Amplitude App: Determining component for location matching...');
    
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        console.log(`✅ Amplitude App: Location match found for ${location}, rendering component`);
        return component;
      }
    }
    
    console.warn('⚠️ Amplitude App: No matching location found, returning null');
    return null;
  }, [sdk.location]);

  console.log('🎨 Amplitude App: Rendering component:', Component ? Component.name : 'null');
  
  return Component ? <Component /> : null;
};

export default App;
