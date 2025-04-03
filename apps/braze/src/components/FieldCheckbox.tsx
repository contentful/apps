import { Box, Flex, IconButton } from '@contentful/f36-components';
import { Field } from '../fields/Field';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceField } from '../fields/ReferenceField';
import { ReferenceItem } from '../fields/ReferenceItem';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import CheckboxCard from './CheckboxCard';
import { Indentation } from './Indentation';

type FieldCheckboxProps =
  | BasicFieldCheckboxProps
  | ReferenceCheckboxProps
  | ReferenceArrayCheckboxProps
  | ReferenceItemCheckboxProps;
const FieldCheckbox = (props: FieldCheckboxProps) => {
  const { field, selectedFields, handleToggle, isLast } = props;
  if (field instanceof ReferenceField) {
    return (
      <ReferenceCheckbox
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        isLast={isLast}
      />
    );
  } else if (field instanceof ReferenceArrayField) {
    return (
      <ReferenceArrayCheckbox
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        isLast={isLast}
      />
    );
  }
  return (
    <BasicFieldCheckbox
      field={field}
      selectedFields={selectedFields}
      handleToggle={handleToggle}
      isLast={isLast}
    />
  );
};

type BasicFieldCheckboxProps = {
  field: Field;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLast?: boolean;
};

const BasicFieldCheckbox = (props: BasicFieldCheckboxProps) => {
  const { field, selectedFields, handleToggle } = props;
  return (
    <Flex alignItems="center">
      <Indentation isLast={props.isLast} />
      <CheckboxCard
        id={field.uniqueId()}
        title={field.displayName()}
        selectedFields={selectedFields}
        onChange={handleToggle}
      />
    </Flex>
  );
};

type ReferenceCheckboxProps = {
  field: ReferenceField;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLast?: boolean;
};
const ReferenceCheckbox = (props: ReferenceCheckboxProps) => {
  const { field, selectedFields, handleToggle, isLast } = props;
  const [show, setShow] = useState(false);
  return (
    <Flex>
      <Indentation isLast={isLast} />
      <CheckboxContainer
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        show={show}
        setShow={setShow}
      />
      {show && (
        <Box paddingLeft="spacingL">
          {field.fields.map((nestedField, index) => {
            return (
              <FieldCheckbox
                key={nestedField.uniqueId()}
                selectedFields={selectedFields}
                field={nestedField}
                handleToggle={handleToggle}
                isLast={field.fields.length - 1 === index}
              />
            );
          })}
        </Box>
      )}
    </Flex>
  );
};

type ReferenceArrayCheckboxProps = {
  field: ReferenceArrayField;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLast?: boolean;
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
  isLast?: boolean;
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
          {field.fields.map((f, index) => {
            return (
              <FieldCheckbox
                key={f.uniqueId()}
                field={f}
                selectedFields={selectedFields}
                handleToggle={handleToggle}
                isLast={field.fields.length - 1 === index}
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
      title={field.displayName()}
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
