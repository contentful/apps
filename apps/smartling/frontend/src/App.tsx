import React from 'react';
import { locations, AppExtensionSDK, SidebarExtensionSDK } from '@contentful/app-sdk';
import AppConfig from './AppConfig';
import Sidebar from './Sidebar';

interface Props {
  sdk: AppExtensionSDK | SidebarExtensionSDK;
}

export default class App extends React.Component<Props> {
  render() {
    const { sdk } = this.props;

    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      return <AppConfig sdk={sdk as AppExtensionSDK} />;
    } else if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      return (
        <Sidebar
          sdk={sdk as SidebarExtensionSDK}
          projectId={(sdk.parameters.installation as SmartlingParameters).projectId}
        />
      );
    }

    return null;
  }
}
