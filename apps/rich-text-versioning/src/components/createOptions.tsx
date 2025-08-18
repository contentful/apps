import { AssetCard, Box, EntryCard, InlineEntryCard } from '@contentful/f36-components';
import { EntryProps, ContentTypeProps, AssetProps } from 'contentful-management';
import { getEntryTitle } from '../utils';
import { Block, BLOCKS, Inline, INLINES } from '@contentful/rich-text-types';
import { Options } from '@contentful/rich-text-react-renderer';
import { css } from 'emotion';

const UNKNOWN = 'Unknown';
const ENTRY_NOT_FOUND = 'Entry not found';
const ASSET_NOT_FOUND = 'Asset not found';
const DELETED = 'deleted';

export const createOptions = (
  entries: EntryProps[],
  entryContentTypes: Record<string, ContentTypeProps>,
  assets: AssetProps[],
  locale: string
): Options => ({
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node: any) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);
      if (!entry) {
        return (
          <Box marginBottom="spacingM">
            <EntryCard contentType={UNKNOWN} title={ENTRY_NOT_FOUND} status={DELETED} />
          </Box>
        );
      }
      const contentType = entryContentTypes[entry.sys.id];
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, locale);
      const status = entry.sys.fieldStatus?.['*']?.[locale];

      return (
        <Box marginBottom="spacingM">
          <EntryCard contentType={contentTypeName} title={title} status={status} />
        </Box>
      );
    },
    [INLINES.EMBEDDED_ENTRY]: (node: any) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);

      if (!entry) {
        return (
          <InlineEntryCard contentType={UNKNOWN} status={DELETED}>
            {ENTRY_NOT_FOUND}
          </InlineEntryCard>
        );
      }

      const contentType = entryContentTypes[entry.sys.id];
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, locale);
      const status = entry.sys.fieldStatus?.['*']?.[locale];

      return (
        <InlineEntryCard contentType={contentTypeName} status={status}>
          {title}
        </InlineEntryCard>
      );
    },
    [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
      const asset = assets.find((a) => a.sys.id === node.data.target.sys.id);

      if (!asset) {
        return (
          <Box margin="spacingM">
            <AssetCard title={ASSET_NOT_FOUND} status={DELETED} size="small" />
          </Box>
        );
      }

      const status = asset.sys?.fieldStatus?.['*']?.[locale];
      const title = asset.fields.title[locale];

      return (
        <Box margin="spacingM">
          <AssetCard status={status} title={title} size="small" />
        </Box>
      );
    },
  },
});
