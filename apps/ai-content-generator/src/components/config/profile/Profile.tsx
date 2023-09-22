import { Dispatch } from 'react';
import { FormControl } from '@contentful/f36-components';
import { ParameterReducer, Validator } from '../parameterReducer';
import { BrandProfileFields, FieldTypes } from '../configText';
import ProfileTextArea from './ProfileTextArea';
import ProfileTextInput from './ProfileTextInput';
import { ProfileType, ProfileFields } from '../appInstallationParameters';

interface Props {
  profile: Validator<ProfileType>;
  dispatch: Dispatch<ParameterReducer>;
}

const Profile = (props: Props) => {
  const { profile, dispatch } = props;

  return (
    <>
      {BrandProfileFields.map((field) => {
        const marginBottomStyle = field.id === ProfileFields.ADDITIONAL ? 'none' : 'spacingL';

        const fieldProps = {
          value: profile[field.id]?.value ?? '',
          name: field.title,
          id: field.id,
          textLimit: field.textLimit,
          placeholder: field.textAreaPlaceholder,
          dispatch: dispatch,
        };

        return (
          <FormControl key={field.id} marginBottom={marginBottomStyle}>
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
