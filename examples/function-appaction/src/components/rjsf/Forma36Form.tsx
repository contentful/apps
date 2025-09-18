import React from 'react';
import Form, { withTheme } from '@rjsf/core';
import {
  Box,
  FormControl,
  TextInput,
  Checkbox,
  Radio,
  Select,
  Button,
  ButtonGroup,
  IconButton,
  Subheading,
  Textarea,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ArrowUpIcon, ArrowDownIcon, CloseIcon, CopyIcon } from '@contentful/f36-icons';
import type {
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  ArrayFieldTemplateProps,
  RegistryWidgetsType,
  WidgetProps,
} from '@rjsf/utils';

const FieldTemplate = (props: FieldTemplateProps) => {
  const {
    id,
    label,
    required,
    rawErrors = [],
    help,
    description,
    children,
    disabled,
    readonly,
    classNames,
  } = props;

  const isInvalid = rawErrors.length > 0;

  // Avoid duplicate headings for object fields; let ObjectFieldTemplate render the section title
  const isObjectField = props?.schema?.type === 'object';
  if (isObjectField) {
    return <>{children}</>;
  }

  return (
    <FormControl
      id={id}
      isRequired={required}
      isInvalid={isInvalid}
      className={classNames}
      isDisabled={disabled}
      isReadOnly={readonly}>
      {label ? <FormControl.Label>{label}</FormControl.Label> : null}
      {description}
      {children}
      {help}
      {isInvalid
        ? rawErrors.map((err, idx) => (
            <FormControl.ValidationMessage key={`${id}-err-${idx}`}>
              {err}
            </FormControl.ValidationMessage>
          ))
        : null}
    </FormControl>
  );
};

const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const { idSchema, title, description, properties, required } = props;
  const isRoot = idSchema && idSchema.$id === 'root';

  if (isRoot) {
    return (
      <Box>
        {properties.map((p: any) => (
          <div key={p.name}>{p.content}</div>
        ))}
      </Box>
    );
  }

  return (
    <Box
      style={{
        border: `1px solid ${tokens.gray300}`,
        borderRadius: '6px',
        padding: tokens.spacingM,
        marginTop: tokens.spacingS,
        marginBottom: tokens.spacingM,
      }}>
      {title ? (
        <Subheading as="h5">
          {title}
          {required ? ' *' : ''}
        </Subheading>
      ) : null}
      {description}
      {properties.map((p: any) => (
        <div key={p.name}>{p.content}</div>
      ))}
    </Box>
  );
};

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, canAdd, onAddClick } = props;
  return (
    <Box>
      {items &&
        items.map((element) => (
          <Box key={element.key} marginBottom="spacingS">
            <Box>{element.children}</Box>
            {element.hasToolbar ? (
              <ButtonGroup variant="spaced">
                {element.hasMoveUp ? (
                  <IconButton
                    aria-label="Move up"
                    icon={<ArrowUpIcon />}
                    onClick={element.onReorderClick(element.index, element.index - 1)}
                  />
                ) : null}
                {element.hasMoveDown ? (
                  <IconButton
                    aria-label="Move down"
                    icon={<ArrowDownIcon />}
                    onClick={element.onReorderClick(element.index, element.index + 1)}
                  />
                ) : null}
                {element.hasCopy ? (
                  <IconButton
                    aria-label="Copy"
                    icon={<CopyIcon />}
                    onClick={element.onCopyIndexClick(element.index)}
                  />
                ) : null}
                {element.hasRemove ? (
                  <IconButton
                    aria-label="Remove"
                    icon={<CloseIcon />}
                    onClick={element.onDropIndexClick(element.index)}
                  />
                ) : null}
              </ButtonGroup>
            ) : null}
          </Box>
        ))}
      {canAdd ? (
        <Box marginTop="spacingS">
          <Button variant="secondary" onClick={onAddClick}>
            Add item
          </Button>
        </Box>
      ) : null}
    </Box>
  );
};

const TextWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    placeholder,
    onChange,
    onBlur,
    onFocus,
    options,
  } = props;
  const inputType = (options && options.inputType) || 'text';
  return (
    <TextInput
      id={id}
      type={inputType}
      value={value ?? ''}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readonly}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur && onBlur(id, e.target.value)}
      onFocus={(e) => onFocus && onFocus(id, e.target.value)}
    />
  );
};

const EmailWidget = (props: WidgetProps) => {
  return <TextWidget {...props} options={{ ...(props.options || {}), inputType: 'email' }} />;
};

const TextareaWidget = (props: WidgetProps) => {
  const { id, value, required, disabled, readonly, placeholder, onChange, onBlur, onFocus } = props;
  return (
    <Textarea
      id={id}
      value={value ?? ''}
      isRequired={required}
      isDisabled={disabled}
      // F36 Textarea doesn't support isReadOnly prop; fallback to disabled when readonly
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur && onBlur(id, e.target.value)}
      onFocus={(e) => onFocus && onFocus(id, e.target.value)}
      placeholder={placeholder}
    />
  );
};

const NumberWidget = (props: WidgetProps) => {
  const { id, value, required, disabled, readonly, placeholder, onChange, onBlur, onFocus } = props;
  return (
    <TextInput
      id={id}
      type="number"
      value={value ?? ''}
      isRequired={required}
      isDisabled={disabled || readonly}
      isReadOnly={readonly}
      placeholder={placeholder}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? undefined : Number(val));
      }}
      onBlur={(e) => onBlur && onBlur(id, e.target.value)}
      onFocus={(e) => onFocus && onFocus(id, e.target.value)}
    />
  );
};

const CheckboxWidget = (props: WidgetProps) => {
  const { id, value, required, disabled, readonly, label, onChange, onBlur, onFocus } = props;
  return (
    <Checkbox
      id={id}
      isChecked={Boolean(value)}
      isRequired={required}
      isDisabled={disabled || readonly}
      onChange={(e) => onChange(e.target.checked)}
      onBlur={() => onBlur && onBlur(id, value)}
      onFocus={() => onFocus && onFocus(id, value)}>
      {label}
    </Checkbox>
  );
};

const SelectWidget = (props: WidgetProps) => {
  const { id, value, required, disabled, readonly, placeholder, onChange, options } = props;
  const { enumOptions = [], multiple } = options;

  if (multiple) {
    return (
      <Select
        id={id}
        isRequired={required}
        isDisabled={disabled || readonly}
        value={value || []}
        multiple
        onChange={(e) => {
          const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(
            (o) => o.value
          );
          onChange(selected);
        }}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {(enumOptions as Array<{ label: string; value: string }>).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Select
      id={id}
      isRequired={required}
      isDisabled={disabled || readonly}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}>
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {(enumOptions as Array<{ label: string; value: string }>).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
};

const RadioWidget = (props: WidgetProps) => {
  const { id, value, required, disabled, readonly, onChange, options } = props;
  const { enumOptions = [] } = options;
  return (
    <Radio.Group
      name={id}
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}>
      {(enumOptions as Array<{ label: string; value: string }>).map((opt) => (
        <Radio key={opt.value} value={opt.value} isDisabled={disabled || readonly}>
          {opt.label}
        </Radio>
      ))}
    </Radio.Group>
  );
};

const widgets: RegistryWidgetsType = {
  TextWidget,
  EmailWidget,
  TextareaWidget,
  NumberWidget,
  CheckboxWidget,
  SelectWidget,
  RadioWidget,
};

const theme = {
  widgets,
  templates: {
    FieldTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
  },
};

const Forma36Form = withTheme(theme);

export default Forma36Form;
