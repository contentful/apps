import React from 'react';
import { render } from 'react-dom';

import {
  BaseAppSDK,
  ConfigAppSDK,
  EditorAppSDK,
  FieldAppSDK,
  init,
  locations,
  PageAppSDK,
  SidebarAppSDK,
} from '@contentful/app-sdk';
import './index.css';

import Config from './components/ConfigScreen';
import EntryEditor from './components/EntryEditor';
import Page from './components/Page';
import Sidebar from './components/Sidebar';
import Field from './components/Field';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

init((sdk: BaseAppSDK) => {
  const root = document.getElementById('root');

  // All possible locations for your app
  // Feel free to remove unused locations
  // Dont forget to delete the file too :)
  const ComponentLocationSettings = [
    {
      location: locations.LOCATION_APP_CONFIG,
      component: <Config sdk={sdk as unknown as ConfigAppSDK} />,
    },
    {
      location: locations.LOCATION_ENTRY_FIELD,
      component: <Field sdk={sdk as unknown as FieldAppSDK} />,
    },
    {
      location: locations.LOCATION_ENTRY_EDITOR,
      component: <EntryEditor sdk={sdk as unknown as EditorAppSDK} />,
    },
    {
      location: locations.LOCATION_DIALOG,
      component: (
        <QueryClientProvider client={queryClient}>
          <Page sdk={sdk as unknown as PageAppSDK} />
        </QueryClientProvider>
      ),
    },
    {
      location: locations.LOCATION_ENTRY_SIDEBAR,
      component: <Sidebar sdk={sdk as unknown as SidebarAppSDK} />,
    },
    {
      location: locations.LOCATION_PAGE,
      component: (
        <QueryClientProvider client={queryClient}>
          <Page sdk={sdk as unknown as PageAppSDK} />
        </QueryClientProvider>
      ),
    },
  ];

  // Select a component depending on a location in which the app is rendered.
  ComponentLocationSettings.forEach((componentLocationSetting) => {
    if (sdk.location.is(componentLocationSetting.location)) {
      render(componentLocationSetting.component, root);
    }
  });
});
