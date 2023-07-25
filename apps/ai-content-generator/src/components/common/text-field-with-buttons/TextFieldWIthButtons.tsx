import { ChangeEvent, ReactNode } from 'react';
import { Flex, Textarea } from '@contentful/f36-components';

interface Props {
  inputText: string;
  onFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}

const TextFieldWithButtons = (props: Props) => {
  const { inputText, onFieldChange, children } = props;
  return (
    <Flex flexDirection="column" fullWidth>
      <Textarea resize="none" rows={14} value={inputText} onChange={onFieldChange}></Textarea>

      <Flex alignSelf="flex-end" marginTop="spacingS">
        {children}
      </Flex>
    </Flex>
  );
};

export default TextFieldWithButtons;
