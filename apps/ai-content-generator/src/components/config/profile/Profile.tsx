import { Dispatch } from 'react';
import { FormControl } from '@contentful/f36-components';
import { ParameterReducer } from '../parameterReducer';
import { BrandProfileFields, FieldTypes, ProfileFields } from '../configText';
import { ProfileType } from '@locations/ConfigScreen';
import ProfileTextArea from './ProfileTextArea';
import ProfileTextInput from './ProfileTextInput';

interface Props {
  profile: ProfileType;
  dispatch: Dispatch<ParameterReducer>;
}

const Profile = (props: Props) => {
  const { profile, dispatch } = props;

  return (
    <>
      {BrandProfileFields.map((field) => {
        const marginBottomStyle = field.id === ProfileFields.ADDITIONAL ? 'none' : 'spacingL';

        const fieldProps = {
          value: profile[field.id] ?? '',
          name: field.title,
          id: field.id,
          placeholder: field.textAreaPlaceholder,
          dispatch: dispatch,
        };

        return (
          <FormControl
            isRequired={field.isRequired}
            key={field.id}
            marginBottom={marginBottomStyle}>
            <FormControl.Label>{field.title}</FormControl.Label>
            {field.fieldType === FieldTypes.TEXTAREA ? (
              <ProfileTextArea {...fieldProps} />
            ) : (
              <ProfileTextInput {...fieldProps} />
            )}
          </FormControl>
        );
      })}
    </>
  );
};

export default Profile;
