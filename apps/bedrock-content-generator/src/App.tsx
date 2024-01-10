import { locations } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import ConfigScreen from "@locations/ConfigScreen";
import Dialog from "@locations/Dialog";
import Sidebar from "@locations/Sidebar";
import { useMemo } from "react";

const ComponentLocationSettings = () => ({
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
});

const App = () => {
  const sdk = useSDK();
  // const { identify } = useContext(SegmentAnalyticsContext);
  // const ldClient = useLDClient();
  const isV2 = true;

  // useEffect(() => {
  //   ldClient?.identify({
  //     key: sdk.user.sys.id,
  //     custom: {
  //       currentSpaceId: sdk.ids.space,
  //     },
  //   });
  // }, [ldClient, sdk.ids.space, sdk.user.sys.id]);

  const Component = useMemo(() => {
    const locations = ComponentLocationSettings();

    for (const [location, component] of Object.entries(locations)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location, isV2]);

  return Component ? <Component /> : null;
};

export default App;
