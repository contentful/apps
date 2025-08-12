import { Document } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Diff } from '@ali-tas/htmldiff-js';
import { useEffect, useState } from 'react';
import { styles } from './HtmlDiffViewer.styles';

interface HtmlDiffViewerProps {
  currentField: Document;
  publishedField: Document;
  onChangeCount: (count: number) => void;
  sdk?: any;
}
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { EntryCard, Skeleton } from '@contentful/f36-components';

const HtmlDiffViewer = ({
  currentField,
  publishedField,
  onChangeCount,
  sdk,
}: HtmlDiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch entry titles first
  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      const titles: Record<string, string> = {};

      const extractEntryIds = (doc: Document): string[] => {
        const ids: string[] = [];
        const traverse = (node: any) => {
          if (
            node.nodeType === 'embedded-entry-block' ||
            node.nodeType === 'embedded-entry-inline'
          ) {
            ids.push(node.data.target.sys.id);
          }
          if (node.content) {
            node.content.forEach(traverse);
          }
        };
        doc.content?.forEach(traverse);
        return ids;
      };

      const entryIds = extractEntryIds(currentField);

      // Fetch titles for each entry
      for (const entryId of entryIds) {
        try {
          const entry = await sdk.cma.entry.get({ entryId });
          const title = entry.fields?.name?.['en-US'] || entry.fields?.title?.['en-US'] || entryId;
          titles[entryId] = title;
        } catch (error) {
          titles[entryId] = entryId;
        }
      }

      setEntryTitles(titles);
      setLoading(false);
    };

    if (sdk) {
      fetchTitles();
    }
  }, [currentField, sdk]);

  const options = {
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        const title = entryTitles[entry.sys.id] || entry.sys.id;
        return `<div>Embedded Entry: ${title}</div>`;
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        const title = entryTitles[entry.sys.id] || entry.sys.id;
        return `<span>Inline Entry: ${title}</span>`;
      },
    },
  };

  useEffect(() => {
    const currentHtml = documentToHtmlString(currentField, options);
    console.log('currentField', currentField);
    console.log('currentHtml', currentHtml);
    const publishedHtml = documentToHtmlString(publishedField, options);
    console.log('publishedHtml', publishedHtml);
    const diff = Diff.execute(publishedHtml, currentHtml);

    setDiffHtml(diff);

    const diffString = diff || '';

    const additions = (diffString.match(/<ins[^>]*>/g) || []).length;
    const deletions = (diffString.match(/<del[^>]*>/g) || []).length;
    const totalChanges = additions + deletions;

    onChangeCount(totalChanges);
  }, [currentField, publishedField, onChangeCount, entryTitles]);

  if (loading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={4} />
      </Skeleton.Container>
    );
  }

  return (
    <>
      <div
        className={styles}
        dangerouslySetInnerHTML={{
          __html: diffHtml,
        }}
      />
    </>
  );
};

export default HtmlDiffViewer;
