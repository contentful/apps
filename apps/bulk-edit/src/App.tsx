import { useMemo, useEffect } from 'react';
import { locations, AppExtensionSDK } from '@contentful/app-sdk';
import Page from './locations/Page';
import { useSDK } from '@contentful/react-apps-toolkit';
import { i18n } from '@lingui/core';
import './App.css';

const ComponentLocationSettings = {
  [locations.LOCATION_PAGE]: Page,
};

const App = () => {
  const sdk = useSDK<AppExtensionSDK>();

  // Initialize Lingui i18n for field editors that require it
  useEffect(() => {
    const defaultLocale = sdk.locales.default;
    if (!i18n.locale) {
      // Initialize with a default locale - field editors will use their own locales
      i18n.load(defaultLocale, {});
      i18n.activate(defaultLocale);
    }
  }, []);

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
