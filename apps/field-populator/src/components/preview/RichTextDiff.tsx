import { Document, BLOCKS } from '@contentful/rich-text-types';
import { Diff } from '@ali-tas/htmldiff-js';
import { useMemo } from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { renderToString } from 'react-dom/server';
import DOMPurify from 'dompurify';
import { styles } from './RichTextDiff.styles';

interface RichTextDiffProps {
  sourceDocument: Document;
  targetDocument: Document | null | undefined;
}

/**
 * Creates an empty rich text document for comparison when target is null/undefined
 */
const createEmptyDocument = (): Document => ({
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [],
});

const RichTextDiff = ({ sourceDocument, targetDocument }: RichTextDiffProps) => {
  const diffHtml = useMemo(() => {
    const sourceComponents = documentToReactComponents(sourceDocument);
    const targetComponents = documentToReactComponents(targetDocument ?? createEmptyDocument());

    const sourceHtml = renderToString(<>{sourceComponents}</>);
    const targetHtml = renderToString(<>{targetComponents}</>);

    const diff = Diff.execute(targetHtml, sourceHtml, {
      combineWords: true,
      ignoreWhiteSpaceDifferences: false,
    });

    return DOMPurify.sanitize(diff);
  }, [sourceDocument, targetDocument]);

  return (
    <div
      className={styles}
      dangerouslySetInnerHTML={{
        __html: diffHtml,
      }}
    />
  );
};

export default RichTextDiff;
