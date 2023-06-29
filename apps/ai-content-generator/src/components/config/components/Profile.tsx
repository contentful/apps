import { FormControl, Textarea } from '@contentful/f36-components';
import { ChangeEvent, Dispatch } from 'react';
import { ParameterAction, ParameterActionTypes } from '../parameterReducer';
import { ProfileText } from './ConfigText';

interface Props {
  profile: string;
  dispatch: Dispatch<ParameterAction>;
}

const Profile = (props: Props) => {
  const { profile, dispatch } = props;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: ParameterActionTypes.PROFILE, value: e.target.value });
  };

  return (
    <FormControl>
      <FormControl.Label>{ProfileText.title}</FormControl.Label>
      <Textarea
        rows={15}
        value={profile}
        name="profile"
        placeholder={ProfileText.textAreaPlaceholder}
        onChange={handleChange}
      />

      <FormControl.HelpText>{ProfileText.helpText}</FormControl.HelpText>
    </FormControl>
  );
};

export default Profile;
