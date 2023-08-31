import { Flex, Paragraph } from '@contentful/f36-components';
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

  const getCharLimitsToDisplay = () => {
    let displayContent = '';

    if (maxLength && minLength) {
      displayContent = `Requires between ${minLength} and ${maxLength} characters`;
    } else if (maxLength) {
      displayContent = `Maximum ${maxLength} characters`;
    } else if (minLength) {
      displayContent = `Requires at least ${minLength} characters`;
    }

    const displayComponent = (
      <Paragraph marginTop="spacing2Xs" css={style}>
        {displayContent}
      </Paragraph>
    );

    return displayContent ? displayComponent : null;
  };

  return (
    <Flex flexDirection="column" marginBottom="spacingM" data-testid="text-counter">
      <Flex justifyContent="space-between">
        <Flex alignContent="center" marginTop="spacing2Xs">
          {!isValid ? (
            <ErrorCircleOutlineIcon
              variant="negative"
              marginRight="spacing2Xs"
              data-testid="error-icon"
            />
          ) : null}
          <Paragraph css={style}>{text.length} characters</Paragraph>
        </Flex>
        {getCharLimitsToDisplay()}
      </Flex>
    </Flex>
  );
};

export default TextCounter;
