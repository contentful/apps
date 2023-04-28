import { createApp } from 'vue';

import { init, locations } from '@contentful/app-sdk';

import AppConfigLocation from './locations/AppConfigLocation.vue';
import FieldLocation from './locations/FieldLocation.vue';
import SidebarLocation from './locations/SidebarLocation.vue';
import EntryLocation from './locations/EntryLocation.vue';
import DialogLocation from './locations/DialogLocation.vue';
import PageLocation from './locations/PageLocation.vue';
import HomeLocation from './locations/HomeLocation.vue';
import LocalhostWarning from './components/LocalhostWarning.vue';

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  createApp(LocalhostWarning).mount('#app');
} else {
  init((sdk) => {
    const locationsMap = {
      [locations.LOCATION_ENTRY_SIDEBAR]: SidebarLocation,
      [locations.LOCATION_PAGE]: PageLocation,
      [locations.LOCATION_HOME]: HomeLocation,
      [locations.LOCATION_ENTRY_EDITOR]: EntryLocation,
      [locations.LOCATION_ENTRY_FIELD]: FieldLocation,
      [locations.LOCATION_DIALOG]: DialogLocation,
      [locations.LOCATION_APP_CONFIG]: AppConfigLocation,
    };

    // Select a component depending on a location in which the app is rendered.
    Object.entries(locationsMap).forEach(([locationKey, Component]) => {
      if (sdk.location.is(locationKey)) {
        createApp(Component, { sdk }).mount('#app');
      }
    });
  });
}
