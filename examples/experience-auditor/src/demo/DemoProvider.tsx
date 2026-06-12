import React from 'react';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { GlobalStyles } from '@contentful/f36-components';

import { demoSdk } from './mockExo';
import ExperienceToolbar from '../locations/ExperienceToolbar';

/**
 * DEMO ONLY — renders the toolbar against a seeded in-memory `sdk.exo` so the
 * audit -> suggested-fix -> re-score loop is clickable via `npm start` before
 * the host renderer is broadly available. Never used on the real app path.
 *
 * The toolkit's `useSDK()` reads `useContext(SDKContext).sdk`, so the context
 * value must be `{ sdk }` — matching what the real `SDKProvider` supplies.
 */
const DemoProvider = () => (
  <SDKContext.Provider value={{ sdk: demoSdk }}>
    <GlobalStyles />
    <ExperienceToolbar />
  </SDKContext.Provider>
);

export default DemoProvider;
