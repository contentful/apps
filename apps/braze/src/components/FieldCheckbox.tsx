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
  const { field, selectedFields, handleToggle } = props;
  if (field instanceof ReferenceField) {
    return (
      <ReferenceCheckbox
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
      />
    );
  } else if (field instanceof ReferenceArrayField) {
    return (
      <ReferenceArrayCheckbox
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
      />
    );
  }
  return (
    <BasicFieldCheckbox field={field} selectedFields={selectedFields} handleToggle={handleToggle} />
  );
};

type BasicFieldCheckboxProps = {
  field: Field;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const BasicFieldCheckbox = (props: BasicFieldCheckboxProps) => {
  const { field, selectedFields, handleToggle } = props;
  return (
    <CheckboxCard
      id={field.uniqueId()}
      title={field.displayNameForGenerate()}
      selectedFields={selectedFields}
      onChange={handleToggle}
      isDisabled={!field.isEnabledForGenerate()}
    />
  );
};

type ReferenceCheckboxProps = {
  field: ReferenceField;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
const ReferenceCheckbox = (props: ReferenceCheckboxProps) => {
  const { field, selectedFields, handleToggle } = props;
  const [show, setShow] = useState(false);
  return (
    <>
      <CheckboxContainer
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        show={show}
        setShow={setShow}
      />
      {show && (
        <Box paddingLeft="spacingL">
          {field.fields.map((nestedField) => {
            return (
              <FieldCheckbox
                key={nestedField.uniqueId()}
                selectedFields={selectedFields}
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
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
const ReferenceArrayCheckbox = (props: ReferenceArrayCheckboxProps) => {
  const { field, selectedFields, handleToggle } = props;
  const [show, setShow] = useState(false);
  return (
    <>
      <CheckboxContainer
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        show={show}
        setShow={setShow}
      />
      {show && (
        <Box paddingLeft="spacingL">
          {field.items.map((item) => {
            return (
              <ReferenceItemCheckbox
                key={item.uniqueId()}
                field={item}
                selectedFields={selectedFields}
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
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
const ReferenceItemCheckbox = (props: ReferenceItemCheckboxProps) => {
  const { field, selectedFields, handleToggle } = props;
  const [show, setShow] = useState(false);
  return (
    <>
      <CheckboxContainer
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        show={show}
        setShow={setShow}
      />
      {show && (
        <Box paddingLeft="spacingL">
          {field.fields.map((field) => {
            return (
              <FieldCheckbox
                key={field.uniqueId()}
                field={field}
                selectedFields={selectedFields}
                handleToggle={handleToggle}
              />
            );
          })}
        </Box>
      )}
    </>
  );
};

const CheckboxContainer = (props: {
  field: Field;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  setShow: (show: boolean) => void;
}) => {
  const { field, selectedFields, handleToggle, show, setShow } = props;

  return (
    <CheckboxCard
      id={field.uniqueId()}
      title={field.displayNameForGenerate()}
      selectedFields={selectedFields}
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
