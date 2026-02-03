import React from 'react';
import { TextInput, TextInputProps } from '@contentful/f36-components';

interface TextInputIntegerProps extends Omit<TextInputProps, 'value' | 'onChange'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

const TextInputInteger: React.FC<TextInputIntegerProps> = ({
  value,
  onChange,
  ...restProps
}: TextInputIntegerProps) => {
  const hasFloatOrNegativeChars = (text: string): boolean => {
    return text.includes('.') || text.includes(',') || text.includes('-');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (hasFloatOrNegativeChars(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');

    if (hasFloatOrNegativeChars(pastedText)) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const inputValue = e.target.value;

    if (hasFloatOrNegativeChars(inputValue)) {
      return;
    }

    const digitsOnly = inputValue.replace(/\D/g, '');

    let numValue: number | undefined = parseInt(digitsOnly, 10);

    if (isNaN(numValue) || digitsOnly === '') {
      numValue = undefined;
    }

    onChange(numValue);
  };

  return (
    <TextInput
      {...restProps}
      type="number"
      step={1}
      value={value !== undefined ? String(value) : ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
};

export default TextInputInteger;
