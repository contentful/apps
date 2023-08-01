import { Flex, Paragraph } from '@contentful/f36-components';
import { styles } from './TextCounter.styles';

interface Props {
  text: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * The Forma36 text counter requires us to restrict the length of the text
 * forcing the user to delete characters to get below the limit. This component
 * is an alternative that will instead not limit the length of the text but
 * instead show a warning message if the text is too long or too short.
 */
const TextCounter = (props: Props) => {
  const { text, maxLength, minLength } = props;

  const isBelowMinLength = text.length < (minLength || 0);
  const isAboveMaxLength = text.length > (maxLength || Infinity);

  const isValid = !isBelowMinLength && !isAboveMaxLength;
  const style = isValid ? styles.validCount : styles.invalidCount;

  return (
    <Flex justifyContent="space-between">
      <Paragraph css={styles.invalidCount}>
        {!isValid &&
          (isBelowMinLength
            ? `The generated text is shorter than the minimum length of ${minLength}`
            : `The generated text is longer than the maximum length of ${maxLength}`)}
      </Paragraph>
      <Paragraph css={style}>
        {text.length} {maxLength && '/ ' + maxLength}
      </Paragraph>
    </Flex>
  );
};

export default TextCounter;
