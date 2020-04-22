import React, { useEffect, useState } from 'react';

import { ContentType, PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { TabPanel, Paragraph } from '@contentful/forma-36-react-components';

import CollectionList from '../components/CollectionList';

// Define rules for incomplete entries.
const INCOMPLETE_CHECK_CONTENT_TYPE = 'album';
const INCOMPLETE_CHECK_REQUIRED_FIELD = 'artist';

interface IncompleteEntriesProps {
  sdk: PageExtensionSDK;
  contentTypes: ContentType[];
}

export default function IncompleteEntries({ contentTypes, sdk }: IncompleteEntriesProps) {
  const [incompleteEntries, setIncompleteEntries] = useState<any[] | null>(null);

  useEffect(() => {
    async function fetchIncompleteEntries() {
      // Fetch entries that don't have an author (incomplete posts).
      const entries = await sdk.space
        .getEntries({
          [`fields.${INCOMPLETE_CHECK_REQUIRED_FIELD}[exists]`]: false,
          content_type: INCOMPLETE_CHECK_CONTENT_TYPE,
          limit: 3,
        })
        .then((entries) => entries.items)
        .catch(() => []);

      setIncompleteEntries(entries);
    }

    fetchIncompleteEntries();
  }, []);

  return (
    <TabPanel id="incomplete" className="f36-margin-top--xl">
      <Paragraph>These entries are missing the {INCOMPLETE_CHECK_REQUIRED_FIELD} field.</Paragraph>
      <CollectionList
        contentTypes={contentTypes}
        entries={incompleteEntries}
        onClickItem={(entryId) => sdk.navigator.openEntry(entryId)}
      />
    </TabPanel>
  );
}
