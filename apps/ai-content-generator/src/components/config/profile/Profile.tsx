import { ChangeEvent, Dispatch } from 'react';
import { FormControl, TextInput, Textarea } from '@contentful/f36-components';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { BrandProfileFields, FieldTypes } from '../configText';
import { ProfileType } from '@locations/ConfigScreen';

interface Props {
  profile: ProfileType;
  dispatch: Dispatch<ParameterReducer>;
}

const TEXTAREA_ROWS = 5;

const Profile = (props: Props) => {
  const { profile, dispatch } = props;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>, field: string) => {
    dispatch({ type: ParameterAction.UPDATE_PROFILE, value: e.target.value, field: field });
  };

  return (
    <>
      {BrandProfileFields.map((field) => {
        const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
          handleChange(e, field.id);
        };

        const fieldProps = {
          value: profile[field.id] ?? '',
          name: field.title,
          placeholder: field.textAreaPlaceholder,
          onChange: onChange,
        };

        return (
          <FormControl isRequired={field.isRequired} key={field.id}>
            <FormControl.Label>{field.title}</FormControl.Label>
            {field.fieldType === FieldTypes.TEXTAREA ? (
              <Textarea rows={TEXTAREA_ROWS} resize="none" {...fieldProps} />
            ) : (
              <TextInput type="text" {...fieldProps} />
            )}
          </FormControl>
        );
      })}
    </>
  );
};

export default Profile;
