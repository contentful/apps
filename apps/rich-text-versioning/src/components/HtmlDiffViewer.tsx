import { Document } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Diff } from '@ali-tas/htmldiff-js';
import { useEffect, useState } from 'react';
import { styles } from './HtmlDiffViewer.styles';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { EntryCard, Skeleton, InlineEntryCard } from '@contentful/f36-components';
import { createRoot } from 'react-dom/client';
import tokens from '@contentful/f36-tokens';
import React from 'react';

interface HtmlDiffViewerProps {
  currentField: Document;
  publishedField: Document;
  onChangeCount: (count: number) => void;
  sdk?: any;
}

const HtmlDiffViewer = ({
  currentField,
  publishedField,
  onChangeCount,
  sdk,
}: HtmlDiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});
  const [entryContentTypes, setEntryContentTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch entry titles first
  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      const titles: Record<string, string> = {};
      const contentTypes: Record<string, string> = {};

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

      // Fetch titles and content types for each entry
      for (const entryId of entryIds) {
        try {
          const entry = await sdk.cma.entry.get({ entryId });
          const title =
            entry.fields?.name?.['en-US'] || entry.fields?.title?.['en-US'] || 'Untitled';
          const contentType = entry.sys.contentType?.sys?.id || 'Unknown';
          titles[entryId] = title;
          contentTypes[entryId] = contentType;
        } catch (error) {
          titles[entryId] = entryId;
          contentTypes[entryId] = 'Unknown';
        }
      }

      setEntryTitles(titles);
      setEntryContentTypes(contentTypes);
      setLoading(false);
    };

    if (sdk) {
      fetchTitles();
    }
  }, [currentField, sdk]);

  // Helper function to convert React component to HTML string
  const componentToHtml = (component: React.ReactElement): Promise<string> => {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      const root = createRoot(container);

      root.render(component);

      // Using setTimeout to ensure React has finished rendering
      //This was causing a race condition where the diff was not being
      // rendered correctly
      // TODO: Make this work without setTimeout
      setTimeout(() => {
        const html = container.innerHTML;
        root.unmount();
        resolve(html);
      }, 0);
    });
  };

  // Create renderers for embedded entries
  const createRenderers = () => ({
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any, _children: any) => {
        const entry = node.data.target;
        const entryId = entry.sys.id;
        const contentType = entryContentTypes[entryId] || 'Unknown';
        const title = entryTitles[entryId] || 'Untitled';
        console.log('entryTitles', entryTitles);

        // Create a wrapper div to avoid prop issues
        return (
          <div>
            <EntryCard
              status="published"
              contentType={contentType}
              title={title || 'Untitled'}
              description={`ID: ${entryId}`}
            />
          </div>
        );
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any, _children: any) => {
        const entry = node.data.target;
        const entryId = entry.sys.id;
        const contentType = entryContentTypes[entryId] || 'Unknown';
        const title = entryTitles[entryId] || 'Untitled';

        // Create a wrapper span to avoid prop issues
        return (
          <span>
            <InlineEntryCard
              status="published"
              contentType={contentType}
              title={title || 'Untitled'}>
              {title || 'Untitled'}
            </InlineEntryCard>
          </span>
        );
      },
    },
  });

  useEffect(() => {
    if (loading) return;

    const processDiff = async () => {
      // Convert current field to React components with embedded entry renderers
      const currentComponents = documentToReactComponents(currentField, createRenderers());
      const publishedComponents = documentToReactComponents(publishedField, createRenderers());

      // Convert React components to HTML strings
      const currentHtml = await componentToHtml(<>{currentComponents}</>);
      const publishedHtml = await componentToHtml(<>{publishedComponents}</>);

      console.log('currentField', currentField);
      console.log('currentHtml', currentHtml);
      console.log('publishedHtml', publishedHtml);

      // Perform diff
      const diff = Diff.execute(publishedHtml, currentHtml);
      setDiffHtml(diff);

      const diffString = diff || '';
      const additions = (diffString.match(/<ins[^>]*>/g) || []).length;
      const deletions = (diffString.match(/<del[^>]*>/g) || []).length;
      const totalChanges = additions + deletions;

      onChangeCount(totalChanges);
    };

    processDiff();
  }, [currentField, publishedField, onChangeCount, entryTitles, entryContentTypes, loading]);

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
