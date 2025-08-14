import { Box, EntryCard, InlineEntryCard } from '@contentful/f36-components';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { getEntryTitle, getEntryStatus } from '../utils';
import { Block, BLOCKS, Inline, INLINES } from '@contentful/rich-text-types';
import { NodeRenderer, Options } from '@contentful/rich-text-react-renderer';

const UNKNOWN = 'Unknown';
const NOT_FOUND = 'Entry not found';
const DELETED = 'deleted';

export const createOptions = (
  entries: EntryProps[],
  entryContentTypes: Record<string, ContentTypeProps>,
  defaultLocale: string
): Options => ({
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node: any) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);
      if (!entry) {
        return (
          <Box marginBottom="spacingM">
            <EntryCard contentType={UNKNOWN} title={NOT_FOUND} status={DELETED} />
          </Box>
        );
      }
      const contentType = entryContentTypes[entry.sys.id];
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, defaultLocale);
      const status = getEntryStatus(entry);

      return (
        <Box marginBottom="spacingM">
          <EntryCard contentType={contentTypeName} title={title} status={status} />
        </Box>
      );
    },
    [INLINES.EMBEDDED_ENTRY]: (node: any) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);

      if (!entry) {
        return <InlineEntryCard contentType={UNKNOWN} title={NOT_FOUND} status={DELETED} />;
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
