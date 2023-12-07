import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { lazy, Suspense, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html {
    height: 100%;
  }
  body {
    height: 100%;
  }
  #root {
    height: 100%;
  }
`;

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: import('./locations/config/ConfigScreen'),
  [locations.LOCATION_ENTRY_FIELD]: import('./locations/Field'),
  [locations.LOCATION_DIALOG]: import('./locations/Dialog'),
  [locations.LOCATION_ENTRY_SIDEBAR]: import('./locations/Sidebar'),
  [locations.LOCATION_PAGE]: import('./locations/Page'),
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, componentModule] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return lazy(() => componentModule);
      }
    }
  }, [sdk.location]);

  if (!Component) {
    return null;
  }

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return (
      <HashRouter>
        {/* @ts-ignore */}
        <GlobalStyle />
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </HashRouter>
    );
  }

  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );
};

export default App;
