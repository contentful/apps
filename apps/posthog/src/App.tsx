import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import Field from './locations/Field';
import EntryEditor from './locations/EntryEditor';
import Dialog from './locations/Dialog';
import Sidebar from './locations/Sidebar';
import Page from './locations/Page';
import Home from './locations/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_HOME]: Home,
};

/** Map location keys to human-readable names for error reporting */
const LocationNames: Record<string, string> = {
  [locations.LOCATION_APP_CONFIG]: 'Configuration',
  [locations.LOCATION_ENTRY_FIELD]: 'Field',
  [locations.LOCATION_ENTRY_EDITOR]: 'Entry Editor',
  [locations.LOCATION_DIALOG]: 'Dialog',
  [locations.LOCATION_ENTRY_SIDEBAR]: 'Sidebar',
  [locations.LOCATION_PAGE]: 'Page',
  [locations.LOCATION_HOME]: 'Home',
};

const App = () => {
  const sdk = useSDK();

  const { Component, locationName } = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return {
          Component: component,
          locationName: LocationNames[location] || 'PostHog Analytics',
        };
      }
    }
    return { Component: undefined, locationName: undefined };
  }, [sdk.location]);

  if (!Component) {
    return null;
  }

  return (
    <ErrorBoundary componentName={locationName}>
      <Component />
    </ErrorBoundary>
  );
};

export default App;
