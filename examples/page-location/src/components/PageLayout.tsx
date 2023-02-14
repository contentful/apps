import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

import { Tabs } from '@contentful/f36-components';

import { useSDK } from '@contentful/react-apps-toolkit';

interface InvocationParams {
  path?: string;
}

export const PageLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sdk = useSDK();

  const currentTab = useRef('/');

  // check if the page already opened with an existing path from the invocation parameters
  useEffect(() => {
    const initialInvocationParameters = sdk.parameters.invocation as InvocationParams;
    if (
      initialInvocationParameters.path &&
      initialInvocationParameters.path !== currentTab.current
    ) {
      navigate(initialInvocationParameters.path);
      currentTab.current = initialInvocationParameters.path;
    }
  }, [sdk.parameters.invocation]);

  const onTabChange = (tabId: string) => {
    sdk.navigator.openCurrentAppPage({ path: tabId });
    currentTab.current = tabId;
    navigate(tabId);
  };

  return (
    <div>
      <Tabs currentTab={location.pathname} onTabChange={onTabChange}>
        <Tabs.List variant="horizontal-divider">
          <Tabs.Tab panelId="/">Dashboard</Tabs.Tab>
          <Tabs.Tab panelId="/incomplete">Incomplete entries</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <Outlet />
    </div>
  );
};
