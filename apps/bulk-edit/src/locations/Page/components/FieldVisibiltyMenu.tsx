import { IconButton, Menu } from '@contentful/f36-components';
import * as icons from '@contentful/f36-icons';
import { ContentTypeField, FilterOption } from '../types';
import tokens from '@contentful/f36-tokens';

interface FieldVisibiltyMenuProps {
  selectedColumns: FilterOption[];
  setSelectedColumns: (columns: FilterOption[]) => void;
  fields: ContentTypeField[];
  getFieldsMapped: (fields: ContentTypeField[]) => FilterOption[];
}

export const FieldVisibiltyMenu = ({
  selectedColumns,
  setSelectedColumns,
  fields,
  getFieldsMapped,
}: FieldVisibiltyMenuProps) => {
  return (
    <Menu closeOnSelect={false}>
      <Menu.Trigger>
        <IconButton
          aria-label="Filed visibility"
          variant="transparent"
          icon={<icons.GearSixIcon />}></IconButton>
      </Menu.Trigger>
      <Menu.List>
        <Menu.Item onClick={() => setSelectedColumns(getFieldsMapped(fields))}>
          Select all
        </Menu.Item>
        <Menu.Item onClick={() => setSelectedColumns([])}>Clear all</Menu.Item>
        <Menu.Divider />
        {getFieldsMapped(fields).map((field) => (
          <Menu.Item
            key={field.value}
            icon={
              selectedColumns.some((c) => c.value === field.value) ? (
                <icons.CheckIcon />
              ) : (
                <icons.CheckIcon color={tokens.gray200} />
              )
            }
            onClick={() => {
              if (selectedColumns.some((c) => c.value === field.value)) {
                setSelectedColumns(selectedColumns.filter((c) => c.value !== field.value));
              } else {
                setSelectedColumns([...selectedColumns, field]);
              }
            }}>
            {field.label}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
};
