import * as React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from '@emotion/css';
import {
  Form,
  Subheading,
  CheckboxField,
  Typography,
  FieldGroup,
  Flex,
  RadioButtonField,
  Paragraph
} from '@contentful/forma-36-react-components';

import { ContentType, CompatibleFields, SelectedFields, FieldsSkuTypes } from './fields';
import { Integration } from '../interfaces';

interface Props {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  onSelectedFieldsChange: Function;
  fieldSkuTypes: FieldsSkuTypes;
  onFieldSkuTypesChange: (fieldSkuTypes: FieldsSkuTypes) => void;
  skuTypes?: Integration['skuTypes'];
}

interface State {
  initialSelectedFields: SelectedFields;
  changedSkuTypes: Record<string, Record<string, boolean>>;
}

export default class FieldSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      initialSelectedFields: { ...props.selectedFields },
      changedSkuTypes: {}
    };
  }

  onSelectedFieldChange = (
    ctId: string,
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updated = { ...this.props.selectedFields };

    if (e.currentTarget.checked) {
      updated[ctId] = (updated[ctId] || []).concat([fieldId]);
    } else {
      updated[ctId] = (updated[ctId] || []).filter(cur => cur !== fieldId);
    }

    this.props.onSelectedFieldsChange(updated);
  };

  onFieldSkuTypesChange = (
    ctId: string,
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const updated = { ...this.props.fieldSkuTypes };

    const isOldField = this.state.initialSelectedFields?.[ctId]?.includes(fieldId) === true;

    if (isOldField === true) {
      // They are changing the type of an existing field, warn them of
      // potential trouble
      const changedSkuTypes = { ...this.state.changedSkuTypes };

      if (changedSkuTypes[ctId] === undefined) {
        changedSkuTypes[ctId] = {};
      }

      changedSkuTypes[ctId][fieldId] = true;

      this.setState({
        changedSkuTypes
      });
    }

    if (updated[ctId] === undefined) {
      updated[ctId] = {};
    }

    updated[ctId][fieldId] = e.target.value;

    this.props.onFieldSkuTypesChange(updated);
  };

  render() {
    const {
      compatibleFields,
      contentTypes,
      selectedFields,
      fieldSkuTypes,
      skuTypes = []
    } = this.props;
    const { changedSkuTypes } = this.state;

    const defaultSkuType = skuTypes.find(skuType => skuType.default === true)?.id;

    return (
      <Typography>
        {contentTypes.map(ct => {
          const fields = compatibleFields[ct.sys.id];
          return (
            <div key={ct.sys.id} className={css({ marginTop: tokens.spacingL })}>
              <Subheading>{ct.name}</Subheading>
              <Form>
                {fields.map(field => (
                  <FieldGroup key={field.id}>
                    <CheckboxField
                      id={`field-box-${ct.sys.id}-${field.id}`}
                      labelText={field.name}
                      helpText={`${
                        field.type === 'Symbol' ? 'Short text' : 'Short text, list'
                      } · Field ID: ${field.id}`}
                      checked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                      onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id)}
                    />
                    {skuTypes.length > 0 && (selectedFields[ct.sys.id] || []).includes(field.id) ? (
                      <>
                        <Flex>
                          {skuTypes.map(skuType => (
                            <RadioButtonField
                              key={skuType.id}
                              id={`skuType-${ct.sys.id}-${field.id}-${skuType.id}`}
                              name={`skuType-${ct.sys.id}-${field.id}`}
                              value={skuType.id}
                              labelText={skuType.name}
                              className="f36-margin-left--l"
                              checked={
                                (fieldSkuTypes[ct.sys.id]?.[field.id] ?? defaultSkuType) ===
                                skuType.id
                              }
                              onChange={this.onFieldSkuTypesChange.bind(this, ct.sys.id, field.id)}
                            />
                          ))}
                        </Flex>
                        {changedSkuTypes?.[ct.sys.id]?.[field.id] === true ? (
                          <Paragraph className="f36-margin-left--l f36-margin-top--s">
                            Note: Changing SKU type can cause problems with existing entries relying
                            on the old SKU type.
                          </Paragraph>
                        ) : null}
                      </>
                    ) : null}
                  </FieldGroup>
                ))}
              </Form>
            </div>
          );
        })}
      </Typography>
    );
  }
}
