import { Box, Checkbox, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { Field } from '../fields/Field';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceField } from '../fields/ReferenceField';
import { ReferenceItem } from '../fields/ReferenceItem';

type FieldCheckboxProps = {
  field: Field;
  handleToggle: (event: { target: { checked: boolean; id: string } }) => void;
};
const FieldCheckbox = (props: FieldCheckboxProps) => {
  const { field, handleToggle } = props;
  if (field instanceof ReferenceField) {
    return <ReferenceCheckbox key={field.id} field={field} handleToggle={handleToggle} />;
  } else if (field instanceof ReferenceArrayField) {
    return <ReferenceArrayCheckbox key={field.id} field={field} handleToggle={handleToggle} />;
  }
  return <BasicFieldCheckbox key={field.id} field={field} handleToggle={handleToggle} />;
};
export default FieldCheckbox;

type BasicFieldCheckboxProps = {
  field: Field;
  handleToggle: (event: { target: { checked: boolean; id: string } }) => void;
};
const BasicFieldCheckbox = (props: BasicFieldCheckboxProps) => {
  const { field, handleToggle } = props;
  return (
    <Box
      className={css({ border: `1px solid ${tokens.gray200}` })}
      margin="spacingXs"
      padding="spacingXs">
      <Checkbox id={field.uniqueId()} isChecked={field.selected} onChange={handleToggle}>
        <Text fontWeight="fontWeightNormal">Basic: {field.uniqueId()}</Text>
      </Checkbox>
    </Box>
  );
};

type ReferenceCheckboxProps = {
  field: ReferenceField;
  handleToggle: (event: { target: { checked: boolean; id: string } }) => void;
};
const ReferenceCheckbox = (props: ReferenceCheckboxProps) => {
  const { field, handleToggle } = props;
  return (
    <>
      <Box
        className={css({ border: `1px solid ${tokens.gray200}` })}
        margin="spacingXs"
        padding="spacingXs">
        <Checkbox id={field.uniqueId()} isChecked={field.selected} onChange={handleToggle}>
          <Text fontWeight="fontWeightNormal">Reference: {field.uniqueId()}</Text>
        </Checkbox>
      </Box>
      {field.fields.map((nestedField) => {
        return (
          <FieldCheckbox
            key={nestedField.uniqueId()}
            field={nestedField}
            handleToggle={handleToggle}
          />
        );
      })}
    </>
  );
};

type ReferenceArrayCheckboxProps = {
  field: ReferenceArrayField;
  handleToggle: (event: { target: { checked: boolean; id: string } }) => void;
};
const ReferenceArrayCheckbox = (props: ReferenceArrayCheckboxProps) => {
  const { field, handleToggle } = props;
  return (
    <>
      <Box
        className={css({ border: `1px solid ${tokens.gray200}` })}
        margin="spacingXs"
        padding="spacingXs">
        <Checkbox id={field.uniqueId()} isChecked={field.selected} onChange={handleToggle}>
          <Text fontWeight="fontWeightNormal">Array of references: {field.uniqueId()}</Text>
        </Checkbox>
      </Box>
      {field.items.map((item) => {
        return (
          <ReferenceItemCheckbox key={item.uniqueId()} item={item} handleToggle={handleToggle} />
        );
      })}
    </>
  );
};

type ReferenceItemCheckboxProps = {
  item: ReferenceItem;
  handleToggle: (event: { target: { checked: boolean; id: string } }) => void;
};
const ReferenceItemCheckbox = (props: ReferenceItemCheckboxProps) => {
  const { item, handleToggle } = props;
  return (
    <>
      <Box
        className={css({ border: `1px solid ${tokens.gray200}` })}
        margin="spacingXs"
        padding="spacingXs">
        <Checkbox id={item.uniqueId()} isChecked={item.selected} onChange={handleToggle}>
          <Text fontWeight="fontWeightNormal">Reference item: {item.uniqueId()} </Text>
        </Checkbox>
      </Box>
      {item.fields.map((field) => {
        return <FieldCheckbox key={field.uniqueId()} field={field} handleToggle={handleToggle} />;
      })}
    </>
  );
};
