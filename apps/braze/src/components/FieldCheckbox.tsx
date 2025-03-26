import { Box, Checkbox, Flex, IconButton, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { Field } from '../fields/Field';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceField } from '../fields/ReferenceField';
import { ReferenceItem } from '../fields/ReferenceItem';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';

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
    <Box
      className={css({
        border: `1px solid ${tokens.gray200}`,
        borderRadius: tokens.borderRadiusSmall,
      })}
      margin="spacingXs"
      padding="spacingXs">
      <Checkbox id={field.uniqueId()} isChecked={field.selected} onChange={handleToggle}>
        <Text fontWeight="fontWeightNormal">{field.displayName()}</Text>
      </Checkbox>
    </Box>
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
    <Flex
      className={css({
        border: `1px solid ${tokens.gray200}`,
        borderRadius: tokens.borderRadiusSmall,
      })}
      justifyContent="space-between"
      alignItems="center"
      margin="spacingXs"
      paddingLeft="spacingXs"
      paddingRight="spacingXs"
      paddingTop="spacing2Xs"
      paddingBottom="spacing2Xs">
      <Checkbox id={field.uniqueId()} isChecked={field.selected} onChange={handleToggle}>
        <Text fontWeight="fontWeightDemiBold">{field.displayName()}</Text>
      </Checkbox>
      <IconButton
        className={css({
          minHeight: '0',
        })}
        icon={show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        aria-label="Down arrow"
        variant="transparent"
        size="small"
        onClick={() => setShow(!show)}
      />
    </Flex>
  );
};

export default FieldCheckbox;
