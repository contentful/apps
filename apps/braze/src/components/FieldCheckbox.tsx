import { Box, Flex, IconButton } from '@contentful/f36-components';
import { Field } from '../fields/Field';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceField } from '../fields/ReferenceField';
import { ReferenceItem } from '../fields/ReferenceItem';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import CheckboxCard from './CheckboxCard';
import { Indentation } from './Indentation';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

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
  const { field, selectedFields, handleToggle, isLast } = props;
  return (
    <Flex alignItems="center" fullWidth>
      <Indentation isLast={isLast} />
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
      <Flex flexDirection="column" fullWidth>
        <CheckboxContainer
          field={field}
          selectedFields={selectedFields}
          handleToggle={handleToggle}
          show={show}
          setShow={setShow}
        />
        {show && (
          <Box paddingLeft={isLast ? 'spacingL' : undefined}>
            {field.fields.map((nestedField, index) => {
              let widget;
              {
                if (!isLast) {
                  widget = (
                    <Flex>
                      <Box
                        className={css({
                          borderLeft: `1px solid ${tokens.gray300}`,
                          width: tokens.spacingL,
                          height: '40px',
                          position: 'relative',
                          right: '24px',
                        })}></Box>
                      <FieldCheckbox
                        key={nestedField.uniqueId()}
                        selectedFields={selectedFields}
                        field={nestedField}
                        handleToggle={handleToggle}
                        isLast={field.fields.length - 1 === index}
                      />
                    </Flex>
                  );
                } else {
                  widget = (
                    <FieldCheckbox
                      key={nestedField.uniqueId()}
                      selectedFields={selectedFields}
                      field={nestedField}
                      handleToggle={handleToggle}
                      isLast={field.fields.length - 1 === index}
                    />
                  );
                }
              }

              return widget;
            })}
          </Box>
        )}
      </Flex>
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
  const { field, selectedFields, handleToggle, isLast } = props;
  const [show, setShow] = useState(false);
  return (
    <Flex flexDirection="column">
      <Flex alignItems="center">
        <Indentation isLast={isLast} />
        <CheckboxContainer
          field={field}
          selectedFields={selectedFields}
          handleToggle={handleToggle}
          show={show}
          setShow={setShow}
        />
      </Flex>
      {show && (
        <Box style={{ paddingLeft: '24px' }}>
          {field.items.map((item, index) => {
            const last = field.items.length - 1 === index;

            return (
              <Flex>
                <Box
                  className={css({
                    borderLeft: `1px solid ${tokens.gray300}`,
                    width: tokens.spacingL,
                    height: '40px',
                    position: 'relative',
                    right: '24px',
                  })}></Box>
                <Indentation isLast={last} />
                <ReferenceItemCheckbox
                  key={item.uniqueId()}
                  field={item}
                  selectedFields={selectedFields}
                  handleToggle={handleToggle}
                  isLast={last}
                />
              </Flex>
            );
          })}
        </Box>
      )}
    </Flex>
  );
};

type ReferenceItemCheckboxProps = {
  field: ReferenceItem;
  selectedFields: Set<string>;
  handleToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLast?: boolean;
};
const ReferenceItemCheckbox = (props: ReferenceItemCheckboxProps) => {
  const { field, selectedFields, handleToggle, isLast } = props;
  const [show, setShow] = useState(false);
  return (
    <Flex flexDirection="column" fullWidth>
      <CheckboxContainer
        field={field}
        selectedFields={selectedFields}
        handleToggle={handleToggle}
        show={show}
        setShow={setShow}
      />
      {show && (
        <Flex>
          <Box
            className={css({
              borderLeft: `1px solid ${tokens.gray300}`,
              width: tokens.spacingL,
              height: `${field.fields.length * 40}px`,
              position: 'relative',
              right: isLast ? '70.5px' : '71px',
            })}></Box>
          <Box style={{ width: '100%' }}>
            {field.fields.map((f, index) => {
              let component;
              {
                if (!isLast) {
                  component = (
                    <Flex>
                      <Box
                        className={css({
                          borderLeft: `1px solid ${tokens.gray300}`,
                          height: '40px',
                          position: 'relative',
                          right: '47.5px',
                        })}></Box>
                      <FieldCheckbox
                        key={f.uniqueId()}
                        field={f}
                        selectedFields={selectedFields}
                        handleToggle={handleToggle}
                        isLast={field.fields.length - 1 === index}
                      />
                    </Flex>
                  );
                } else {
                  component = (
                    <FieldCheckbox
                      key={f.uniqueId()}
                      field={f}
                      selectedFields={selectedFields}
                      handleToggle={handleToggle}
                      isLast={field.fields.length - 1 === index}
                    />
                  );
                }
              }

              return component;
            })}
          </Box>
        </Flex>
      )}
    </Flex>
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
        style={{ minHeight: 0 }}
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
