import { Box, IconButton } from '@contentful/f36-components';
import { Field } from '../fields/Field';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceField } from '../fields/ReferenceField';
import { ReferenceItem } from '../fields/ReferenceItem';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import CheckboxCard from './CheckboxCard';

type FieldCheckboxProps =
  | BasicFieldCheckboxProps
  | ReferenceCheckboxProps
  | ReferenceArrayCheckboxProps
  | ReferenceItemCheckboxProps;
const FieldCheckbox = (props: FieldCheckboxProps) => {
  const { field, handleToggle } = props;
  if (field instanceof ReferenceField) {
    return <ReferenceCheckbox key={field.id} field={field} handleToggle={handleToggle} />;
  } else if (field instanceof ReferenceArrayField) {
    return <ReferenceArrayCheckbox key={field.id} field={field} handleToggle={handleToggle} />;
  }
  return <BasicFieldCheckbox key={field.id} field={field} handleToggle={handleToggle} />;
};

type BasicFieldCheckboxProps = {
  field: Field;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const BasicFieldCheckbox = (props: BasicFieldCheckboxProps) => {
  const { field, handleToggle } = props;
  return (
    <CheckboxCard
      id={field.uniqueId()}
      isSelected={field.selected}
      title={field.displayName()}
      onChange={handleToggle}
    />
  );
};

type ReferenceCheckboxProps = {
  field: ReferenceField;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
const ReferenceCheckbox = (props: ReferenceCheckboxProps) => {
  const { field, handleToggle } = props;
  const [show, setShow] = useState(false);
  return (
    <>
      <CheckboxContainer field={field} handleToggle={handleToggle} show={show} setShow={setShow} />
      {show && (
        <Box paddingLeft="spacingL">
          {field.fields.map((nestedField) => {
            return (
              <FieldCheckbox
                key={nestedField.uniqueId()}
                field={nestedField}
                handleToggle={handleToggle}
              />
            );
          })}
        </Box>
      )}
    </>
  );
};

type ReferenceArrayCheckboxProps = {
  field: ReferenceArrayField;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
const ReferenceArrayCheckbox = (props: ReferenceArrayCheckboxProps) => {
  const { field, handleToggle } = props;
  const [show, setShow] = useState(false);
  return (
    <>
      <CheckboxContainer field={field} handleToggle={handleToggle} show={show} setShow={setShow} />
      {show && (
        <Box paddingLeft="spacingL">
          {field.items.map((item) => {
            return (
              <ReferenceItemCheckbox
                key={item.uniqueId()}
                field={item}
                handleToggle={handleToggle}
              />
            );
          })}
        </Box>
      )}
    </>
  );
};

type ReferenceItemCheckboxProps = {
  field: ReferenceItem;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
const ReferenceItemCheckbox = (props: ReferenceItemCheckboxProps) => {
  const { field, handleToggle } = props;
  const [show, setShow] = useState(false);
  return (
    <>
      <CheckboxContainer field={field} handleToggle={handleToggle} show={show} setShow={setShow} />
      {show && (
        <Box paddingLeft="spacingL">
          {field.fields.map((field) => {
            return (
              <FieldCheckbox key={field.uniqueId()} field={field} handleToggle={handleToggle} />
            );
          })}
        </Box>
      )}
    </>
  );
};

const CheckboxContainer = (props: {
  field: Field;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  setShow: (show: boolean) => void;
}) => {
  const { field, handleToggle, show, setShow } = props;

  return (
    <CheckboxCard
      id={field.uniqueId()}
      isSelected={field.selected}
      title={field.displayName()}
      onChange={handleToggle}
      fontWeight="fontWeightDemiBold">
      <IconButton
        style={{ minHeight: '0' }}
        icon={show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        aria-label="Down arrow"
        variant="transparent"
        size="small"
        onClick={() => setShow(!show)}
      />
    </CheckboxCard>
  );
};

export default FieldCheckbox;
