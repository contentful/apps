import { ChangeEvent, ReactNode } from 'react';
import { Flex, FormControl, Textarea } from '@contentful/f36-components';
import { ContentTypeFieldValidation } from 'contentful-management';
import TextCounter from './TextCounter';

interface Props {
  inputText: string;
  onFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  sizeValidation?: ContentTypeFieldValidation['size'] | null;
}

const TextFieldWithButtons = (props: Props) => {
  const { inputText, onFieldChange, children, sizeValidation } = props;
  return (
    <FormControl>
      <Flex flexDirection="column" fullWidth>
        <Textarea resize="none" rows={14} value={inputText} onChange={onFieldChange}></Textarea>
        <TextCounter
          text={inputText}
          maxLength={sizeValidation?.max}
          minLength={sizeValidation?.min}
        />

        <Flex alignSelf="flex-end" marginTop="spacingXs">
          {children}
        </Flex>
      </Flex>
    </FormControl>
  );
};

export default TextFieldWithButtons;
