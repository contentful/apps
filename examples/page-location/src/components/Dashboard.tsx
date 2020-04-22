import React, { useEffect, useState } from 'react';

import { ContentType, PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { TabPanel, Heading, Paragraph } from '@contentful/forma-36-react-components';

import Collection from './Collection';
import CollectionList from './CollectionList';

interface DashboardProps {
  sdk: PageExtensionSDK;
  contentTypes: ContentType[];
}

interface CollectionsState {
  total: number | null;
  published: number | null;
  scheduled: number | null;
  recent: any[] | null;
}

export default function Dashboard({ sdk, contentTypes }: DashboardProps) {
  const [data, setData] = useState<CollectionsState>({
    total: null,
    published: null,
    scheduled: null,
    recent: null,
  });

  useEffect(() => {
    async function fetchData() {
      // Fetch some basic statistics.
      const [total, published, scheduled] = await Promise.all([
        sdk.space
          .getEntries()
          .then((entries) => entries.total)
          .catch(() => 0),
        sdk.space
          .getPublishedEntries()
          .then((entries) => entries.total)
          .catch(() => 0),
        sdk.space
          .getAllScheduledActions()
          .then((entries) => entries.length)
          .catch(() => 0),
      ]);

      setData({ ...data, total, published, scheduled });

      // Fetch some entries were last updated by the current user.
      const recent = await sdk.space
        .getEntries({ 'sys.updatedBy.sys.id': sdk.user.sys.id, limit: 3 })
        .then((entries) => entries.items)
        .catch(() => []);

      // Set the final data. Loading complete.
      setData({ total, published, scheduled, recent });
    }

    fetchData();
  }, []);

  return (
    <TabPanel id="dashboard" className="f36-margin-top--xl">
      <div id="collections">
        <Collection label="Total entries" value={data.total} />
        <Collection label="Published entries" value={data.published} />
        <Collection label="Scheduled entries" value={data.scheduled} />
      </div>

      <div className="f36-margin-top--xl">
        <Heading element="h2">Your recent work</Heading>
        <Paragraph>These entries were most recently updated by you.</Paragraph>
        <CollectionList
          contentTypes={contentTypes}
          entries={data.recent}
          onClickItem={(entryId) => sdk.navigator.openEntry(entryId)}
        />
      </div>
    </TabPanel>
  );
}
