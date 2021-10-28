import * as React from 'react';
import get from 'lodash/get';
import set from 'lodash/set';
import omit from 'lodash/omit';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { Form, Subheading, CheckboxField } from '@contentful/forma-36-react-components';

import { ToggleGroup } from './ToggleGroup';
import { CompatibleFields, FieldsConfig } from '../fields';
import { PickerMode, ContentType } from '../../interfaces';

const styles = {
  fieldGroup: css({
    display: 'flex',
    flexDirection: 'column'
  }),
  select: css({
    marginLeft: '10px'
  })
};

interface Props {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: FieldsConfig;
  onSelectedFieldsChange: Function;
}

export default class FieldSelector extends React.Component<Props> {
  onSelectedFieldChange = (
    ctId: string,
    fieldId: string,
    type: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isTargetChecked = e.currentTarget.checked;

    this.props.onSelectedFieldsChange(
      isTargetChecked
        ? set(Object.assign({}, this.props.selectedFields), [ctId, fieldId], type)
        : omit(this.props.selectedFields, [`${ctId}.${fieldId}`])
    );
  };

  onSelectedFieldTypeChange(ctId: string, fieldId: string, type: PickerMode) {
    this.props.onSelectedFieldsChange(
      set(Object.assign({}, this.props.selectedFields), [ctId, fieldId], type)
    );
  }

  render() {
    const { compatibleFields, contentTypes, selectedFields } = this.props;

    return contentTypes.map(ct => {
      const fields = compatibleFields[ct.sys.id];
      return (
        <div key={ct.sys.id} className={css({ marginTop: tokens.spacingL })}>
          <Subheading>{ct.name}</Subheading>
          <Form>
            {fields.map(field => {
              const type = get(selectedFields, [ct.sys.id, field.id], null);
              const isChecked = !!type;

              return (
                <div className={styles.fieldGroup} key={field.id}>
                  <CheckboxField
                    id={`field-box-${ct.sys.id}-${field.id}`}
                    labelText={field.name}
                    helpText={`${
                      field.type === 'Symbol' ? 'Short text' : 'Short text, list'
                    } · Field ID: ${field.id}`}
                    checked={isChecked}
                    onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id, 'product')}
                  />
                  {isChecked && (
                    <ToggleGroup
                      activePickerMode={type}
                      onChange={type => this.onSelectedFieldTypeChange(ct.sys.id, field.id, type)}
                      field={field}
                    />
                  )}
                </div>
              );
            })}
          </Form>
        </div>
      );
    });
  }
}
