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
  RadioButtonField
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

export default class FieldSelector extends React.Component<Props> {
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
