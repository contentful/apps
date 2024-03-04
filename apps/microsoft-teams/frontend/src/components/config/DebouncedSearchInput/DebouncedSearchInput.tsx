import React, { useMemo } from 'react';
import { Box, IconButton, TextInput } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { debounce } from 'lodash';

type Props = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
};

const DebouncedSearchInput = ({ onChange, placeholder, disabled = false }: Props) => {
  const debouncedHandleChange = useMemo(() => debounce(onChange, 1000), []);

  return (
    <Box marginBottom="spacingM">
      <TextInput.Group>
        <TextInput
          placeholder={placeholder}
          onChange={debouncedHandleChange}
          isDisabled={disabled}
        />
        <IconButton
          variant="secondary"
          icon={<SearchIcon />}
          aria-label="magnifying glass icon"
          aria-hidden={true}
          isDisabled={disabled}
        />
      </TextInput.Group>
    </Box>
  );
};

export default DebouncedSearchInput;
