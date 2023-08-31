import React from 'react';
import { render } from 'react-dom';

import {
  ConfigAppSDK,
  FieldAppSDK,
  SidebarAppSDK,
  DialogAppSDK,
  EditorAppSDK,
  PageAppSDK,
  BaseAppSDK,
  init,
  locations,
} from '@contentful/app-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import './index.css';

import Config from './components/ConfigScreen';
import EntryEditor from './components/EntryEditor';
import Page from './components/Page';
import Sidebar from './components/Sidebar';
import Field from './components/Field';
import Dialog from './components/Dialog';

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
      component: <Dialog sdk={sdk as unknown as DialogAppSDK} />,
    },
    {
      location: locations.LOCATION_ENTRY_SIDEBAR,
      component: <Sidebar sdk={sdk as unknown as SidebarAppSDK} />,
    },
    {
      location: locations.LOCATION_PAGE,
      component: <Page sdk={sdk as unknown as PageAppSDK} />,
    },
  ];

  // Select a component depending on a location in which the app is rendered.
  ComponentLocationSettings.forEach((componentLocationSetting) => {
    if (sdk.location.is(componentLocationSetting.location)) {
      render(componentLocationSetting.component, root);
    }
  });
});
