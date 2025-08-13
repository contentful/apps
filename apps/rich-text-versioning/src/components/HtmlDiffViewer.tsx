import { Document } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Diff } from '@ali-tas/htmldiff-js';
import { useEffect, useState, useMemo } from 'react';
import { styles } from './HtmlDiffViewer.styles';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { EntryCard, Skeleton, InlineEntryCard } from '@contentful/f36-components';
import { renderToString } from 'react-dom/server';
import tokens from '@contentful/f36-tokens';
import React from 'react';
import { ContentTypeProps } from 'contentful-management';
interface HtmlDiffViewerProps {
  currentField: Document;
  publishedField: Document;
  onChangeCount: (count: number) => void;
  entryTitles: Record<string, string>;
  entryContentTypes: Record<string, ContentTypeProps>;
}

const UNTITLED = 'Untitled';
const UNKNOWN = 'Unknown';

const HtmlDiffViewer = ({
  currentField,
  publishedField,
  onChangeCount,
  entryTitles,
  entryContentTypes,
}: HtmlDiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');

  // Helper function to convert React component to HTML string
  const componentToHtml = (component: React.ReactElement): string => {
    return renderToString(component);
  };

  const createOptions = () => ({
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any, _children: any) => {
        const entry = node.data.target;
        const entryId = entry.sys.id;
        const contentType = entryContentTypes[entryId] || { name: UNKNOWN };
        const title = entryTitles[entryId] || UNTITLED;
        console.log('entryTitles', entryTitles);

        // Create a wrapper div to avoid prop issues
        return (
          <div>
            <EntryCard contentType={contentType.name} title={title || UNTITLED} />
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
              actions={[]}
              contentType={contentType.name}
              title={title || 'Untitled'}>
              {title || 'Untitled'}
            </InlineEntryCard>
          </span>
        );
      },
    },
  });

  useEffect(() => {
    const processDiff = async () => {
      // Convert current field to React components with embedded entry renderers
      const currentComponents = documentToReactComponents(currentField, createOptions());
      const publishedComponents = documentToReactComponents(publishedField, createOptions());

      // Convert React components to HTML strings
      const currentHtml = componentToHtml(<>{currentComponents}</>);
      const publishedHtml = componentToHtml(<>{publishedComponents}</>);

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
  }, [currentField, publishedField, onChangeCount, entryTitles, entryContentTypes]);

  if (!diffHtml) {
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
