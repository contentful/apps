import { useInBrowser } from '~/hooks/useInBrowser';
import { useLocation, useNavigate } from 'react-router';
import { useInBrowserSdk } from '~/hooks/useInBrowserSdk';
import * as AppSDK from '@contentful/app-sdk';

export const useAppSdkRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sdk } = useInBrowserSdk();

  useInBrowser(() => {
    if (!sdk) {
      return;
    }

    const Locations = [
      AppSDK.locations.LOCATION_APP_CONFIG,
      AppSDK.locations.LOCATION_ENTRY_FIELD,
      AppSDK.locations.LOCATION_ENTRY_EDITOR,
      AppSDK.locations.LOCATION_DIALOG,
      AppSDK.locations.LOCATION_ENTRY_SIDEBAR,
      AppSDK.locations.LOCATION_PAGE,
      AppSDK.locations.LOCATION_HOME,
    ] as const;

    const requestedLocation = Locations.find((key) => sdk?.location.is(key));

    if (!requestedLocation) {
      console.error(`Unknown app location`);
      return;
    }

    if (location.pathname === `/${requestedLocation}`) {
      return;
    }

    const params = new URLSearchParams(sdk?.ids);
    return navigate(`/${requestedLocation}?${params.toString()}`);
  }, [sdk]);
};
