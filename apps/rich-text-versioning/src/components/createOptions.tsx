import { EntryCard, InlineEntryCard } from '@contentful/f36-components';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { getEntryTitle, getEntryStatus } from '../utils';
import { Block, BLOCKS, Inline, INLINES } from '@contentful/rich-text-types';

const UNKNOWN = 'Unknown';

export const createOptions = (
  entries: EntryProps[],
  entryContentTypes: Record<string, ContentTypeProps>,
  defaultLocale: string
) => ({
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);
      if (!entry) {
        return <div>Reference is missing</div>;
      }
      const contentType = entryContentTypes[entry.sys.id];
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, defaultLocale);
      const status = getEntryStatus(entry);

      return <EntryCard contentType={contentTypeName} title={title} status={status} />;
    },
    [INLINES.EMBEDDED_ENTRY]: (node: Block | Inline) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);

      if (!entry) {
        return <div>Reference is missing</div>;
      }

      const contentType = entryContentTypes[entry.sys.id];
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, defaultLocale);
      const status = getEntryStatus(entry);

      return (
        <InlineEntryCard contentType={contentTypeName} title={title} status={status}>
          {title}
        </InlineEntryCard>
      );
    },
  },
});
