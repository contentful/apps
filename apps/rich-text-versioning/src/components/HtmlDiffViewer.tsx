import { Block, Document, Inline } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Diff } from '@ali-tas/htmldiff-js';
import { useEffect, useState, useMemo } from 'react';
import { styles } from './HtmlDiffViewer.styles';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Skeleton } from '@contentful/f36-components';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { createOptions } from './createOptions';
interface HtmlDiffViewerProps {
  currentField: Document;
  publishedField: Document;
  onChangeCount: (count: number) => void;
  entries: EntryProps[];
  entryContentTypes: Record<string, ContentTypeProps>;
  defaultLocale: string;
}

const HtmlDiffViewer = ({
  currentField,
  publishedField,
  onChangeCount,
  entries,
  entryContentTypes,
  defaultLocale,
}: HtmlDiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');

  // Helper function to convert React component to HTML string
  const componentToHtml = (component: React.ReactElement): string => {
    return renderToString(component);
  };

  useEffect(() => {
    const processDiff = async () => {
      // Convert current field to React components with embedded entry renderers
      const currentComponents = documentToReactComponents(
        currentField,
        createOptions(entries, entryContentTypes, defaultLocale)
      );
      const publishedComponents = documentToReactComponents(
        publishedField,
        createOptions(entries, entryContentTypes, defaultLocale)
      );

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
  }, [currentField, publishedField, onChangeCount, entries, entryContentTypes]);

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
