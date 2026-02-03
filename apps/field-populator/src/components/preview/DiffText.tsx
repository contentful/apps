import { Text } from '@contentful/f36-components';
import { computeTextDiff, DiffSegment } from '../../utils/textDiff';
import { styles } from './DiffText.styles';

interface DiffTextProps {
  sourceText: string;
  targetText: string;
  preformatted?: boolean;
}

const DiffText = ({ sourceText, targetText, preformatted = false }: DiffTextProps) => {
  const segments = computeTextDiff(sourceText, targetText);

  const content = segments.map((segment: DiffSegment, index: number) => {
    if (segment.type === 'added') {
      return (
        <span key={index} className={styles.added}>
          {segment.text}
        </span>
      );
    }

    if (segment.type === 'removed') {
      return (
        <span key={index} className={styles.removed}>
          {segment.text}
        </span>
      );
    }

    return <span key={index}>{segment.text}</span>;
  });

  if (preformatted) {
    return (
      <Text as="pre" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
        {content}
      </Text>
    );
  }

  return <Text>{content}</Text>;
};

export default DiffText;
