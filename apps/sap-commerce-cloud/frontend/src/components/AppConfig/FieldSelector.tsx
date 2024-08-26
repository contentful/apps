import { ChangeEvent } from 'react';
import { styles } from '@components/AppConfig/FieldSelector.styles';
import { Form, Subheading, FormControl, Checkbox } from '@contentful/f36-components';

import { ContentType, CompatibleFields, SelectedFields } from '@components/AppConfig/fields';

interface Props {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  onSelectedFieldsChange: Function;
}

export default function FieldSelector({
  contentTypes,
  compatibleFields,
  selectedFields,
  onSelectedFieldsChange,
}: Props) {
  const onSelectedFieldChange = (
    ctId: string,
    fieldId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const updated = { ...selectedFields };

    if (e.currentTarget.checked) {
      updated[ctId] = (updated[ctId] || []).concat([fieldId]);
    } else {
      updated[ctId] = (updated[ctId] || []).filter((cur) => cur !== fieldId);
    }

    onSelectedFieldsChange(updated);
  };

  return (
    <>
      {contentTypes.map((ct) => {
        const fields = compatibleFields[ct.sys.id];
        return (
          <div key={ct.sys.id} className={styles.fieldSelector}>
            <Subheading>{ct.name}</Subheading>
            <Form>
              {fields.map((field) => (
                <FormControl id={`field-box-${ct.sys.id}-${field.id}`} key={field.id}>
                  <Checkbox
                    aria-label={field.name}
                    helpText={`${
                      field.type === 'Symbol' ? 'Short text' : 'Short text, list'
                    } · Field ID: ${field.id}`}
                    isChecked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                    onChange={onSelectedFieldChange.bind(null, ct.sys.id, field.id)}>
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
