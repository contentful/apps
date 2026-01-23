import React, { useEffect, useState } from 'react';

import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Grid, Box } from '@contentful/f36-components';

import Collection from './Collection';
import CollectionList from './CollectionList';
import { useSDK } from '@contentful/react-apps-toolkit';

interface DashboardProps {
  contentTypes: ContentType[];
}

interface CollectionsState {
  total: number | null;
  published: number | null;
  scheduled: number | null;
  recent: any[] | null;
}

export default function Dashboard({ contentTypes }: DashboardProps) {
  const sdk = useSDK<PageAppSDK>();
  const cma = sdk.cma;
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
        cma.entry
          .getMany({})
          .then((entries) => entries.total || 0)
          .catch(() => 0),
        sdk.space
          .getPublishedEntries()
          .then((entries) => entries.total || 0)
          .catch(() => 0),
        cma.scheduledActions
          .getMany({ environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment })
          .then((actions) => actions.items.length)
          .catch(() => 0),
        ,
      ]);

      setData({ ...data, total, published, scheduled });

      // Fetch some entries were last updated by the current user.
      const recent = await cma.entry
        .getMany({ query: { 'sys.updatedBy.sys.id': sdk.user.sys.id, limit: 3 } })
        .then((resp) => resp.items)
        .catch(() => []);

      // Set the final data. Loading complete.
      setData({ total, published, scheduled, recent });
    }

    fetchData();
  }, []);

  return (
    <Box marginTop="spacingXl">
      <Grid columns="1fr 1fr 1fr" columnGap="spacingM">
        <Collection label="Total entries" value={data.total} />
        <Collection label="Published entries" value={data.published} />
        <Collection label="Scheduled entries" value={data.scheduled} />
      </Grid>

      <Box marginTop="spacingXl">
        <Heading as="h2">Your recent work</Heading>
        <Paragraph>These entries were most recently updated by you.</Paragraph>
        <CollectionList
          contentTypes={contentTypes}
          entries={data.recent}
          onClickItem={(entryId) => sdk.navigator.openEntry(entryId)}
        />
      </Box>
    </Box>
  );
}
