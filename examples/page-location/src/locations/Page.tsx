import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';

import { Heading, Box } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';

import Dashboard from '../components/Dashboard';

import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { PageLayout } from '../components/PageLayout';
import IncompleteEntries from '../components/IncompleteEntries';

function NotFound() {
  return <Heading>404</Heading>;
}

export const PageRouter = () => {
  return (
    <BrowserRouter>
      <Page />
    </BrowserRouter>
  );
};

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const cma = sdk.cma;
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    cma.contentType.getMany({}).then((result) => result?.items && setContentTypes(result.items));
  }, []);

  return (
    <Box marginTop="spacingXl" className="page">
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Dashboard contentTypes={contentTypes} />} />
          <Route path="incomplete" element={<IncompleteEntries contentTypes={contentTypes} />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};
