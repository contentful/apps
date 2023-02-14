import React from 'react';

import { ContentEntitySys, ContentType } from '@contentful/app-sdk';
import { Box, EntityList, EntityListItem, HelpText } from '@contentful/f36-components';

function getEntryStatus(entrySys: ContentEntitySys) {
  if (!!entrySys.archivedVersion) {
    return 'archived';
  } else if (!!entrySys.publishedVersion && entrySys.version == entrySys.publishedVersion + 1) {
    return 'published';
  } else if (!!entrySys.publishedVersion && entrySys.version >= entrySys.publishedVersion + 2) {
    return 'changed';
  }
  return 'draft';
}

interface CollectionListProps {
  entries: any;
  contentTypes: ContentType[];
  onClickItem: (entryId: string) => void;
}

export default function CollectionList({
  contentTypes,
  entries,
  onClickItem,
}: CollectionListProps) {
  // Loading state.
  if (!entries) {
    return (
      <Box marginTop="spacingM">
        <EntityList>
          {Array(3)
            .fill('')
            .map((_, i) => (
              <EntityListItem key={i} title="loading" className="entity-loading" isLoading />
            ))}
        </EntityList>
      </Box>
    );
  }

  if (entries.length) {
    return (
      <Box marginTop="spacingM">
        <EntityList>
          {entries.map((entry: any) => {
            const contentType =
              contentTypes.length &&
              contentTypes.find((ct) => ct.sys.id === entry.sys.contentType.sys.id);
            return (
              <EntityListItem
                className="cr-pointer"
                entityType="entry"
                onClick={() => onClickItem(entry.sys.id)}
                key={entry.sys.id}
                title={
                  (contentType &&
                    entry.fields[contentType.displayField] &&
                    entry.fields[contentType.displayField]['en-US']) ||
                  'Untitled'
                }
                status={getEntryStatus(entry.sys)}
                contentType={contentType ? contentType.name : entry.sys.contentType.type}
              />
            );
          })}
        </EntityList>
      </Box>
    );
  }

  // No entries found (after fetching/loading).
  return (
    <Box marginTop="spacingM">
      <HelpText>No entries found.</HelpText>
    </Box>
  );
}
