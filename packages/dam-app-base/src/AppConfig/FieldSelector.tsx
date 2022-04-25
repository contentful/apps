import { Checkbox, Form, Subheading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import * as React from 'react';
import { CompatibleFields, ContentType, SelectedFields } from './fields';

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

  render() {
    const { compatibleFields, contentTypes, selectedFields } = this.props;

    return (
      <>
        {contentTypes.map((ct) => (
          <div key={ct.sys.id} className={css({ marginTop: tokens.spacingL })}>
            <Subheading>{ct.name}</Subheading>
            <Form>
              {compatibleFields[ct.sys.id].map((field) => (
                <Checkbox
                  key={field.id}
                  id={`field-box-${ct.sys.id}-${field.id}`}
                  helpText={`Field ID: ${field.id}`}
                  isChecked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                  onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id)}
                >
                  {field.name}
                </Checkbox>
              ))}
            </Form>
          </div>
        ))}
      </>
    );
  }
}
