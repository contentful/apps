import React from 'react';

import { EntrySys, ContentType } from '@contentful/app-sdk';
import { EntityList, EntityListItem, HelpText } from '@contentful/forma-36-react-components';

function getEntryStatus(entrySys: EntrySys) {
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
      <EntityList className="f36-margin-top--m">
        {Array(3)
          .fill('')
          .map((_, i) => (
            <EntityListItem key={i} title="loading" isLoading />
          ))}
      </EntityList>
    );
  }

  if (entries.length) {
    return (
      <EntityList className="f36-margin-top--m">
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
    );
  }

  // No entries found (after fetching/loading).
  return <HelpText className="f36-margin-top--m">No entries found.</HelpText>;
}
