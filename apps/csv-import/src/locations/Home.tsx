import React from 'react';
import { Card, Heading, Paragraph, Button } from '@contentful/f36-components';
import { HomeAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageShell } from '../components/PageShell';

const Home = () => {
  const sdk = useSDK<HomeAppSDK>();

  const handleOpenApp = () => {
    // Navigate to the full app page
    sdk.navigator.openAppPage();
  };

  return (
    <PageShell title="">
      <Card>
        <Heading marginBottom="spacingM">CSV Import</Heading>
        <Paragraph marginBottom="spacingM">
          Import entries from CSV files into your Contentful space. The CSV Import app supports
          creating new entries and updating existing ones with field mapping, validation, and bulk
          operations.
        </Paragraph>
        <Paragraph marginBottom="spacingM">
          <strong>Features:</strong>
        </Paragraph>
        <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
          <li>Create and update entries from CSV</li>
          <li>Column-to-field mapping with locale support</li>
          <li>Dry-run validation before import</li>
          <li>Throttled execution with progress tracking</li>
          <li>Error reporting and downloadable results</li>
        </ul>
        <Button variant="primary" onClick={handleOpenApp}>
          Open CSV Importer
        </Button>
      </Card>
    </PageShell>
  );
};

export default Home;
