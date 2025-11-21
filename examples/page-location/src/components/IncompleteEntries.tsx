import React, { useEffect, useState } from 'react';

import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import { Box, Paragraph } from '@contentful/f36-components';

import CollectionList from '../components/CollectionList';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { CollectionProp, EntryProps } from 'contentful-management';

// Define rules for incomplete entries.
const INCOMPLETE_CHECK_CONTENT_TYPE = 'album';
const INCOMPLETE_CHECK_REQUIRED_FIELD = 'artist';

interface IncompleteEntriesProps {
  contentTypes: ContentType[];
}

export default function IncompleteEntries({ contentTypes }: IncompleteEntriesProps) {
  const [incompleteEntries, setIncompleteEntries] = useState<any[] | null>(null);

  const sdk = useSDK<PageAppSDK>();
  const cma = sdk.cma;

  useEffect(() => {
    async function fetchIncompleteEntries() {
      // Fetch entries that don't have an author (incomplete posts).
      const entries = await cma.entry
        .getMany({
          query: {
            [`fields.${INCOMPLETE_CHECK_REQUIRED_FIELD}[exists]`]: false,
            content_type: INCOMPLETE_CHECK_CONTENT_TYPE,
            limit: 3,
          },
        })
        .then((entries: CollectionProp<EntryProps>) => entries.items)
        .catch(() => []);

      setIncompleteEntries(entries);
    }

    fetchIncompleteEntries();
  }, []);

  return (
    <Box marginTop="spacingXl">
      <Paragraph>These entries are missing the {INCOMPLETE_CHECK_REQUIRED_FIELD} field.</Paragraph>
      <CollectionList
        contentTypes={contentTypes}
        entries={incompleteEntries}
        onClickItem={(entryId) => sdk.navigator.openEntry(entryId)}
      />
    </Box>
  );
}
