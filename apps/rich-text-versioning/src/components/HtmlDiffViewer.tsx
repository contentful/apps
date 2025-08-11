import { Document } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Diff } from '@ali-tas/htmldiff-js';
import { useEffect, useState } from 'react';
import { styles } from './HtmlDiffViewer.styles';

interface HtmlDiffViewerProps {
  currentField: Document;
  publishedField: Document;
  onChangeCount: (count: number) => void;
}

const HtmlDiffViewer = ({ currentField, publishedField, onChangeCount }: HtmlDiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');

  useEffect(() => {
    const currentHtml = documentToHtmlString(currentField);
    const publishedHtml = documentToHtmlString(publishedField);
    const diff = Diff.execute(publishedHtml, currentHtml);

    setDiffHtml(diff);

    const diffString = diff || '';

    const additions = (diffString.match(/<ins[^>]*>/g) || []).length;
    const deletions = (diffString.match(/<del[^>]*>/g) || []).length;
    const totalChanges = additions + deletions;

    onChangeCount(totalChanges);
  }, []);

  return (
    <div
      className={styles}
      dangerouslySetInnerHTML={{
        __html: diffHtml,
      }}
    />
  );
};

export default HtmlDiffViewer;
