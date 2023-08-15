import { ChangeEvent, ReactNode } from 'react';
import { Flex, Textarea, Paragraph } from '@contentful/f36-components';
import { ContentTypeFieldValidation } from 'contentful-management';
import TextCounter from '../text-counter/TextCounter';
import { styles } from './TextFieldWithButtons.styles';

interface Props {
  inputText: string;
  onFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  sizeValidation?: ContentTypeFieldValidation['size'] | null;
  isDisabled?: boolean;
  placeholder?: string;
  helpText?: string;
}

const TextFieldWithButtons = (props: Props) => {
  const { inputText, onFieldChange, children, sizeValidation, isDisabled, placeholder, helpText } =
    props;
  return (
    <Flex
      flexDirection="column"
      fullWidth
      paddingLeft="spacing2Xl"
      paddingRight="spacing2Xl"
      css={styles.container}>
      <Textarea
        resize="none"
        css={styles.textarea}
        value={inputText}
        onChange={onFieldChange}
        isDisabled={isDisabled}
        placeholder={placeholder}></Textarea>
      <TextCounter
        text={inputText}
        maxLength={sizeValidation?.max}
        minLength={sizeValidation?.min}
      />

      <Flex alignSelf="flex-end">
        <Paragraph css={styles.helpText}>{helpText}</Paragraph>
        {children}
      </Flex>
    </Flex>
  );
};

export default TextFieldWithButtons;
