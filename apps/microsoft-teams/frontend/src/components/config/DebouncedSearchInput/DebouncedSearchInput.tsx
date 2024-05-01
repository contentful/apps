import React, { useMemo } from 'react';
import { Box, TextInput } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { debounce } from 'lodash';

type Props = {
  placeholder: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

const DebouncedSearchInput = ({ onChange = () => {}, placeholder, disabled = false }: Props) => {
  const debouncedHandleChange = useMemo(() => debounce(onChange, 300), []);

  return (
    <Box marginBottom="spacingM">
      <TextInput.Group>
        <TextInput
          placeholder={placeholder}
          onChange={debouncedHandleChange}
          isDisabled={disabled}
          icon={<SearchIcon />}
        />
      </TextInput.Group>
    </Box>
  );
};

export default DebouncedSearchInput;
