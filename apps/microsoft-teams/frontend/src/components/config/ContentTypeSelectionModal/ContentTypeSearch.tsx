import React, { useMemo } from 'react';
import { Box, IconButton, TextInput } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { debounce } from 'lodash';

type Props = {
  placeholder: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
};

const ContentTypeSearch = ({ placeholder, handleChange }: Props) => {
  const debouncedHandleChange = useMemo(() => debounce(handleChange, 1000), []);

  return (
    <Box marginBottom="spacingM">
      <TextInput.Group>
        <TextInput placeholder={placeholder} onChange={debouncedHandleChange} />
        <IconButton variant="secondary" icon={<SearchIcon />} aria-label="magnifying glass icon" />
      </TextInput.Group>
    </Box>
  );
};

export default ContentTypeSearch;
