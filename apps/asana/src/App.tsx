import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Note } from '@contentful/f36-components';
import ConfigScreen from './locations/ConfigScreen';
import Dialog from './locations/Dialog';
import Field from './locations/Field';
import Sidebar from './locations/Sidebar';

const App = () => {
  const sdk = useSDK();

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return <ConfigScreen />;
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    return <Sidebar />;
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    return <Field />;
  }

  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    return <Dialog />;
  }

  return (
    <Note title="Unsupported location">
      This version of the Asana app currently supports the app configuration screen, entry field,
      entry sidebar, and dialog.
    </Note>
  );
};

export default App;
