import * as React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from '@emotion/css';
import { Checkbox, Flex, Form, Subheading } from '@contentful/f36-components';
import { ContentType, CompatibleFields, SelectedFields } from './fields';

interface Props {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  onSelectedFieldsChange: Function;
}
export default class FieldSelector extends React.Component<Props> {
  onSelectedFieldChange = (
    ctId: string,
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updated = { ...this.props.selectedFields };

    if (e.currentTarget.checked) {
      updated[ctId] = (updated[ctId] || []).concat([fieldId]);
    } else {
      updated[ctId] = (updated[ctId] || []).filter((cur) => cur !== fieldId);
    }

    this.props.onSelectedFieldsChange(updated);
  };

  render() {
    const { compatibleFields, contentTypes, selectedFields } = this.props;

    return (
      <>
        {contentTypes.map((ct) => {
          const fields = compatibleFields[ct.sys.id];
          return (
            <div key={ct.sys.id} className={css({ marginTop: tokens.spacingL })}>
              <Subheading style={{ marginBottom: tokens.spacingM }}>{ct.name}</Subheading>
              <Form>
                {fields.map((field) => (
                  <Flex marginTop="spacingM" flexDirection="column" gap="spacingXs" key={field.id}>
                    <Checkbox
                      id={`field-box-${ct.sys.id}-${field.id}`}
                      helpText={`${
                        field.type === 'Symbol' ? 'Short text' : 'Short text, list'
                      } · Field ID: ${field.id}`}
                      isChecked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                      onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id)}>
                      {field.name}
                    </Checkbox>
                  </Flex>
                ))}
              </Form>
            </div>
          );
        })}
      </>
    );
  }
}
