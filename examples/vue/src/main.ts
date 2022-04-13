import { createApp } from "vue";

import { init, locations } from "@contentful/app-sdk";

import AppConfig from "./locations/AppConfig.vue";
import Field from "./locations/Field.vue";
import Sidebar from "./locations/Sidebar.vue";
import Entry from "./locations/Entry.vue";
import Dialog from "./locations/Dialog.vue";
import Page from "./locations/Page.vue";
import LocalhostWarning from "./components/LocalhostWarning.vue";

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  createApp(LocalhostWarning).mount("#app");
} else {
  init((sdk) => {
    const locationsMap = {
      [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
      [locations.LOCATION_PAGE]: Page,
      [locations.LOCATION_ENTRY_EDITOR]: Entry,
      [locations.LOCATION_ENTRY_FIELD]: Field,
      [locations.LOCATION_DIALOG]: Dialog,
      [locations.LOCATION_APP_CONFIG]: AppConfig,
    };

    // Select a component depending on a location in which the app is rendered.
    Object.entries(locationsMap).forEach(([locationKey, Component]) => {
      if (sdk.location.is(locationKey)) {
        createApp(Component, { sdk }).mount("#app");
      }
    });
  });

}

