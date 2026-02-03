import { Document, BLOCKS } from '@contentful/rich-text-types';
import { Diff } from '@ali-tas/htmldiff-js';
import { useMemo } from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { renderToString } from 'react-dom/server';
import DOMPurify from 'dompurify';
import { styles } from './RichTextDiff.styles';

interface RichTextDiffProps {
  document: Document;
  compareDocument: Document | null | undefined;
}

/**
 * Creates an empty rich text document for comparison when compareDocument is null/undefined
 */
const createEmptyDocument = (): Document => ({
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [],
});

const RichTextDiff = ({ document, compareDocument }: RichTextDiffProps) => {
  const diffHtml = useMemo(() => {
    const currentComponents = documentToReactComponents(document);
    const compareComponents = documentToReactComponents(compareDocument ?? createEmptyDocument());

    const currentHtml = renderToString(<>{currentComponents}</>);
    const compareHtml = renderToString(<>{compareComponents}</>);

    const diff = Diff.execute(currentHtml, compareHtml, {
      combineWords: true,
      ignoreWhiteSpaceDifferences: false,
    });

    return DOMPurify.sanitize(diff);
  }, [document, compareDocument]);

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
