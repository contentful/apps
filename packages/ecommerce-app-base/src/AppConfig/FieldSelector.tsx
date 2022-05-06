import { Checkbox, Flex, Form, Paragraph, Radio, Subheading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import * as React from 'react';
import { Integration } from '../interfaces';
import { CompatibleFields, ContentType, FieldsSkuTypes, SelectedFields } from './fields';

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

const styles = {
  helpText: css({
    marginLeft: tokens.spacingL,
    marginTop: tokens.spacingS,
  }),
};

export default class FieldSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      initialSelectedFields: { ...props.selectedFields },
      changedSkuTypes: {},
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
      updated[ctId] = (updated[ctId] || []).filter((cur) => cur !== fieldId);
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
        changedSkuTypes,
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
      skuTypes = [],
    } = this.props;
    const { changedSkuTypes } = this.state;

    const defaultSkuType = skuTypes.find((skuType) => skuType.default === true)?.id;

    return (
      <>
        {contentTypes.map((ct) => (
          <div key={ct.sys.id} className={css({ marginTop: tokens.spacingL })}>
            <Subheading>{ct.name}</Subheading>
            <Form>
              {compatibleFields[ct.sys.id].map((field) => (
                <Flex marginTop="spacingM" flexDirection="column" gap="spacingXs" key={field.id}>
                  <Checkbox
                    id={`field-box-${ct.sys.id}-${field.id}`}
                    helpText={`${
                      field.type === 'Symbol' ? 'Short text' : 'Short text, list'
                    } · Field ID: ${field.id}`}
                    isChecked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                    onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id)}
                  >
                    {field.name}
                  </Checkbox>
                  {skuTypes.length > 0 && (selectedFields[ct.sys.id] || []).includes(field.id) ? (
                    <>
                      <Flex gap="spacingL">
                        {skuTypes.map((skuType) => (
                          <Radio
                            key={`skuType-${ct.sys.id}-${field.id}-${skuType.id}`}
                            id={`skuType-${ct.sys.id}-${field.id}-${skuType.id}`}
                            name={`skuType-${ct.sys.id}-${field.id}`}
                            value={skuType.id}
                            isChecked={
                              (fieldSkuTypes[ct.sys.id]?.[field.id] ?? defaultSkuType) ===
                              skuType.id
                            }
                            onChange={this.onFieldSkuTypesChange.bind(this, ct.sys.id, field.id)}
                          >
                            {skuType.name}
                          </Radio>
                        ))}
                      </Flex>
                      {changedSkuTypes?.[ct.sys.id]?.[field.id] === true ? (
                        <Paragraph className={styles.helpText}>
                          Note: Changing SKU type can cause problems with existing entries relying
                          on the old SKU type.
                        </Paragraph>
                      ) : null}
                    </>
                  ) : null}
                </Flex>
              ))}
            </Form>
          </div>
        ))}
      </>
    );
  }
}
