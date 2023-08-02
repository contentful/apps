import { ChangeEvent, ReactNode } from 'react';
import { Flex, Textarea, Paragraph } from '@contentful/f36-components';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

const TEXTAREA_ROWS = 26;

const styles = {
  helperText: css({
    display: 'flex',
    alignItems: 'center',
    color: `${tokens.gray500}`,
    margin: `0 ${tokens.spacingS}`,
  }),
};

interface Props {
  inputText: string;
  onFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  isDisabled?: boolean;
  placeholder?: string;
  helperText?: string;
}

const TextFieldWithButtons = (props: Props) => {
  const { inputText, onFieldChange, children, isDisabled, placeholder, helperText } = props;

  return (
    <Flex flexDirection="column" fullWidth paddingLeft="spacing2Xl" paddingRight="spacing2Xl">
      <Textarea
        resize="none"
        rows={TEXTAREA_ROWS}
        value={inputText}
        onChange={onFieldChange}
        isDisabled={isDisabled}
        placeholder={placeholder}></Textarea>

      <Flex alignSelf="flex-end" marginTop="spacingL">
        <Paragraph css={styles.helperText}>{helperText}</Paragraph>
        {children}
      </Flex>
    </Flex>
  );
};

export default TextFieldWithButtons;
