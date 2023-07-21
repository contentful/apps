import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreenV1 from './locations/ConfigScreenV1';
import ConfigScreen from '@locations/ConfigScreen';
import DialogV1 from './locations/DialogV1';
import Dialog from '@locations/Dialog';
import EntryEditor from '@locations/EntryEditor';
import Field from '@locations/Field';
import Page from '@locations/Page';
import SidebarV1 from './locations/SidebarV1';
import Sidebar from '@locations/Sidebar';
import Home from '@locations/Home';

const useV2App = true;

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: useV2App ? ConfigScreen : ConfigScreenV1,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: useV2App ? Dialog : DialogV1,
  [locations.LOCATION_ENTRY_SIDEBAR]: useV2App ? Sidebar : SidebarV1,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_HOME]: Home,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
