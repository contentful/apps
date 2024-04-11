import { ChangeEvent } from 'react';
import { Box, FormControl, Select as F36Select } from '@contentful/f36-components';

import { styles } from './Select.styles';

interface Props {
  options: { id: string; name: string }[];
  label: string;
  placeholder: string;
  emptyMessage?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = ({
  options,
  label,
  placeholder,
  value,
  onChange,
  emptyMessage = 'No options to select',
}: Props) => {
  const optionsExist = Boolean(options && options.length);
  return (
    <Box>
      <FormControl className={styles.formControl} id="optionsSelect" isRequired={true}>
        <FormControl.Label>{label}</FormControl.Label>
        <F36Select
          isDisabled={!optionsExist}
          id="optionsSelect"
          name="optionsSelect"
          value={value}
          onChange={onChange}>
          {optionsExist ? (
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
      </FormControl>
    </Box>
  );
};
