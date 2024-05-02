import { ChangeEvent } from 'react';
import { Select as F36Select } from '@contentful/f36-components';
import { SelectionWrapper } from '../SelectionWrapper/SelectionWrapper';

interface Props {
  options: { id: string; name: string }[];
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  isLoading: boolean;
  label?: string;
  isRequired?: boolean;
  helpText?: string | React.ReactNode;
  errorMessage?: string;
  emptyMessage?: string;
}

export const Select = ({
  options,
  label,
  placeholder,
  value,
  onChange,
  isLoading,
  emptyMessage = 'No options to select',
  isRequired,
  helpText,
  errorMessage,
}: Props) => {
  const optionsExist = Boolean(options && options.length);

  return (
    <SelectionWrapper
      label={label}
      isLoading={isLoading}
      isRequired={isRequired}
      helpText={helpText}
      errorMessage={errorMessage}>
      <F36Select
        isDisabled={!optionsExist}
        id="optionsSelect"
        data-testid="optionsSelect"
        name="optionsSelect"
        isInvalid={Boolean(errorMessage)}
        value={value}
        onChange={onChange}>
        {optionsExist || isLoading ? (
          <>
            <F36Select.Option value="" isDisabled>
              {placeholder}
            </F36Select.Option>
            {options.map((option) => (
              <F36Select.Option key={`option-${option.id}`} value={option.id}>
                {option.name}
              </F36Select.Option>
            ))}
          </>
        ) : (
          <F36Select.Option value="">{emptyMessage}</F36Select.Option>
        )}
      </F36Select>
    </SelectionWrapper>
  );
};
