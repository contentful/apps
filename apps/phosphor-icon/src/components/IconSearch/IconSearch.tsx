import { TextInput } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';

interface IconSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IconSearch({ value, onChange, placeholder = 'Search icons...' }: IconSearchProps) {
  return (
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      icon={<SearchIcon />}
      size="medium"
      aria-label="Search icons"
    />
  );
}
