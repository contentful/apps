import * as React from 'react';
import { styles } from './FieldSelector.styles';
import { Form, Subheading, FormControl, Checkbox } from '@contentful/f36-components';

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
        {contentTypes.map((ct) => {
          const fields = compatibleFields[ct.sys.id];
          return (
            <div key={ct.sys.id} className={styles.fieldSelector}>
              <Subheading>{ct.name}</Subheading>
              <Form>
                {fields.map((field) => (
                  <FormControl id={`field-box-${ct.sys.id}-${field.id}`}>
                    <Checkbox
                      key={field.id}
                      helpText={`${
                        field.type === 'Symbol' ? 'Short text' : 'Short text, list'
                      } · Field ID: ${field.id}`}
                      isChecked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                      onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id)}>
                      {field.name}
                    </Checkbox>
                  </FormControl>
                ))}
              </Form>
            </div>
          );
        })}
      </>
    );
  }
}
