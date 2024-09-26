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

    const LocationRoutes = {
      [AppSDK.locations.LOCATION_APP_CONFIG]: 'app-config',
      [AppSDK.locations.LOCATION_ENTRY_FIELD]: 'field',
      [AppSDK.locations.LOCATION_ENTRY_EDITOR]: 'entry-editor',
      [AppSDK.locations.LOCATION_DIALOG]: 'dialog',
      [AppSDK.locations.LOCATION_ENTRY_SIDEBAR]: 'sidebar',
      [AppSDK.locations.LOCATION_PAGE]: 'page',
      [AppSDK.locations.LOCATION_HOME]: 'home',
    };

    const path = Object.keys(LocationRoutes).find((key) => sdk?.location.is(key));

    if (!path) {
      console.error('Unknown app location');
      return;
    }

    if (location.pathname === `/${path}`) {
      return;
    }

    const params = new URLSearchParams(sdk?.ids);
    return navigate(`/${path}?${params.toString()}`);
  }, [sdk]);
};
