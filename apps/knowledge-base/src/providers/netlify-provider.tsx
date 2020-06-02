import * as React from 'react';

interface NetlifyContextProps {
  isReady: boolean;
  isLoading: boolean;
  isLoadingSites: boolean;
  isLoadingUserInfo: boolean;
  isLoadingBuildHooks: boolean;
  accessToken: string;
  sites: Record<string, any>[];
  userInfo: Record<string, any>;
  authorize?: () => void;
  getBuildHooksBySiteId?: (siteId: string) => Promise<any>;
  getDeploysBySiteId?: (siteId: string) => Promise<any>;
  getNetlifySites?: () => Promise<any>;
}

const { createContext, useContext, useState, useEffect } = React;

const NetlifyContext = createContext<NetlifyContextProps>({
  isReady: false,
  isLoading: false,
  isLoadingSites: false,
  isLoadingUserInfo: false,
  isLoadingBuildHooks: false,
  accessToken: '',
  sites: [],
  userInfo: {},
});

const netlifyApiUrl = 'https://api.netlify.com/api/v1';

export const NetlifyProvider: React.FC = (props) => {
  const [token, setToken] = useState(
    localStorage.getItem('netlify-access-token') ?? ''
  );
  const [sites, setNetlifySites] = useState([]);
  const [userInfo, setNetlifyUserInfo] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const [isLoadingBuildHooks, setIsLoadingBuildHooks] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    window.localStorage.setItem('netlify-access-token', token);

    Promise.all([
      getNetlifySites({
        token,
      }),
      getNetlifyUserInfo({
        token,
      }),
    ])
      .then(() => {
        setIsReady(true);
      })
      .catch((err) => {
        console.log({ err });
        // in case the token is expired
        window.localStorage.removeItem('netlify-access-token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  async function handleNetlifyConnection() {
    setIsLoading(true);

    const authWindow = window.open(
      `https://app.netlify.com/authorize?response_type=token&client_id=${process.env.NETLIFY_OAUTH_APP_ID}f&redirect_uri=${process.env.NETLIFY_OAUTH_APP_REDIRECT_URI}`,
      '',
      'width=600, height=550'
    );

    const interval = setInterval(async function () {
      if (authWindow.closed) {
        clearInterval(interval);
        setIsLoading(false);
      }

      try {
        if (authWindow.location.href.includes('/auth')) {
          const url = new URL(authWindow.location.href);
          const [accessToken] = url.hash
            .slice(1)
            .split('&')
            .map((part) => {
              return part.split('=')[1];
            });

          setToken(accessToken);

          authWindow.close();
        }
      } catch (err) {
        // catch same origin policy errors
      }
    }, 100);
  }

  async function getNetlifySites({ token }) {
    setIsLoadingSites(true);

    try {
      const request = await fetch(`${netlifyApiUrl}/sites`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!request.ok) throw new Error('Request failed.');

      const sites = await request.json();
      const buildableSites = sites.filter(
        (site) => !!Object.keys(site.build_settings).length
      );
      setNetlifySites(buildableSites);

      return buildableSites;
    } catch (err) {
      throw err;
    } finally {
      setIsLoadingSites(false);
    }
  }

  async function getNetlifyUserInfo({ token }) {
    setIsLoadingUserInfo(true);

    try {
      const request = await fetch(`${netlifyApiUrl}/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!request.ok) throw new Error('Request failed.');

      const json = await request.json();
      setNetlifyUserInfo(json);

      return json;
    } catch (err) {
      throw err;
    } finally {
      setIsLoadingUserInfo(false);
    }
  }

  async function getNetlifyWebhooks({ token, siteId }) {
    setIsLoadingBuildHooks(true);

    try {
      const request = await fetch(
        `${netlifyApiUrl}/sites/${siteId}/build_hooks`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!request.ok) throw new Error('Request failed.');

      const json = await request.json();
      return json;
    } catch (err) {
      throw err;
    } finally {
      setIsLoadingBuildHooks(false);
    }
  }

  async function getDeploysBySiteId({ token, siteId }) {
    const request = await fetch(`${netlifyApiUrl}/sites/${siteId}/deploys`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!request.ok) throw new Error('Request failed.');

    const json = await request.json();
    return json;
  }

  return (
    <NetlifyContext.Provider
      value={{
        accessToken: token,
        sites,
        isReady,
        userInfo,
        isLoading,
        isLoadingSites,
        isLoadingUserInfo,
        isLoadingBuildHooks,
        authorize: handleNetlifyConnection,
        getBuildHooksBySiteId: (siteId) =>
          getNetlifyWebhooks({ token, siteId }),
        getNetlifySites: () => getNetlifySites({ token }),
        getDeploysBySiteId: (siteId) => getDeploysBySiteId({ token, siteId }),
      }}
    >
      {props.children}
    </NetlifyContext.Provider>
  );
};

export const useNetlify = (): NetlifyContextProps => {
  return useContext(NetlifyContext);
};
