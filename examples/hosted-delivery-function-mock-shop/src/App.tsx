import { useMemo } from "react";
import { locations } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";

import ConfigScreen from "./locations/ConfigScreen";
import Field from "./locations/Field";
import Dialog from "./locations/Dialog";
import Home from "./locations/Home";

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_HOME]: Home,
};

const App = () => {
  const sdk = useSDK();
  const [, Component = () => null] = useMemo(
    () =>
      Object.entries(ComponentLocationSettings).find(([locationKey]) =>
        sdk.location.is(locationKey)
      ) ?? [],
    [sdk.location]
  );

  return <Component />
};

export default App;
