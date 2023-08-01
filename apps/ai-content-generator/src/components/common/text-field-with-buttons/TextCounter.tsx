import { Flex, Icon, Paragraph } from '@contentful/f36-components';
import { ErrorCircleOutlineIcon } from '@contentful/f36-icons';
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
    <Flex flexDirection="column">
      <Flex justifyContent="space-between">
        <Paragraph marginTop="spacing2Xs" css={style}>
          {text.length} characters
        </Paragraph>
        {maxLength && (
          <Paragraph marginTop="spacing2Xs" css={styles.validCount}>
            Maximum {maxLength} characters
          </Paragraph>
        )}
      </Flex>
      <Flex
        css={{ visibility: isValid ? 'hidden' : 'visible' }}
        alignContent="center"
        marginTop="spacingXs">
        <Icon variant="negative" as={ErrorCircleOutlineIcon}></Icon>
        <Paragraph marginLeft="spacing2Xs" css={styles.invalidCount}>
          {isBelowMinLength ? `Please lengthen the text` : `Please shorten the text`}
        </Paragraph>
      </Flex>
    </Flex>
  );
};

export default TextCounter;
