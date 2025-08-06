import { Document } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import HtmlDiff from 'html-diff-ts';
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
    if (currentField && publishedField) {
      const currentHtml = documentToHtmlString(currentField);
      const publishedHtml = documentToHtmlString(publishedField);
      const diff = HtmlDiff(publishedHtml, currentHtml);

      setDiffHtml(diff);

      const additions = (diff.match(/<ins[^>]*>/g) || []).length;
      const deletions = (diff.match(/<del[^>]*>/g) || []).length;
      const totalChanges = additions + deletions;

      onChangeCount(totalChanges);
    }
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
