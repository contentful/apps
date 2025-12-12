import { AssetCard, Box, EntryCard, InlineEntryCard } from '@contentful/f36-components';
import { EntryProps, ContentTypeProps, AssetProps } from 'contentful-management';
import { getEntryTitle } from '../utils';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { Options } from '@contentful/rich-text-react-renderer';

const UNKNOWN = 'Unknown';
const ENTRY_NOT_FOUND = 'Entry missing or inaccessible';
const ASSET_NOT_FOUND = 'Asset missing or inaccessible';

export const createOptions = (
  entries: EntryProps[],
  entryContentTypes: ContentTypeProps[],
  assets: AssetProps[],
  locale: string
): Options => ({
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node: any) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);
      if (!entry) {
        return (
          <Box marginBottom="spacingM">
            <EntryCard contentType={UNKNOWN} title={ENTRY_NOT_FOUND} />
          </Box>
        );
      }
      const contentType = entryContentTypes.find(
        (ct) => ct.sys.id === entry.sys.contentType.sys.id
      );
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, locale);

      return (
        <Box marginBottom="spacingM">
          <EntryCard contentType={contentTypeName} title={title} />
        </Box>
      );
    },
    [INLINES.EMBEDDED_ENTRY]: (node: any) => {
      const entry = entries.find((e) => e.sys.id === node.data.target.sys.id);

      if (!entry) {
        return <InlineEntryCard contentType={UNKNOWN}>{ENTRY_NOT_FOUND}</InlineEntryCard>;
      }

      const contentType = entryContentTypes.find(
        (ct) => ct.sys.id === entry.sys.contentType.sys.id
      );
      const contentTypeName = contentType?.name || UNKNOWN;
      const title = getEntryTitle(entry, contentType, locale);

      return <InlineEntryCard contentType={contentTypeName}>{title}</InlineEntryCard>;
    },
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const asset = assets.find((a) => a.sys.id === node.data.target.sys.id);

      if (!asset) {
        return (
          <Box margin="spacingM">
            <AssetCard title={ASSET_NOT_FOUND} size="small" />
          </Box>
        );
      }

      const title = asset.fields.title[locale];

      return (
        <Box margin="spacingM">
          <AssetCard title={title} size="small" />
        </Box>
      );
    },
  },
});
