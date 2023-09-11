import { ChangeEvent, Dispatch, useEffect, useState } from 'react';
import { TextInput } from '@contentful/f36-components';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { useDebounce } from 'usehooks-ts';
import { ProfileFields } from '../configText';

interface Props {
  value: string;
  name: string;
  id: string;
  placeholder: string;
  dispatch: Dispatch<ParameterReducer>;
}

const ProfileTextInput = (props: Props) => {
  const { value, name, id, placeholder, dispatch } = props;
  const [fieldValue, setFieldValue] = useState('');
  const debouncedValue = useDebounce<string>(fieldValue, 300);

  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  useEffect(() => {
    if (id === ProfileFields.PROFILE) {
      dispatch({ type: ParameterAction.UPDATE_PROFILE, value: debouncedValue });
    } else {
      dispatch({ type: ParameterAction.UPDATE_BRAND_PROFILE, value: debouncedValue, field: id });
    }
  }, [debouncedValue, dispatch, id]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFieldValue(e.target.value);
  };

  return (
    <TextInput
      type="text"
      value={fieldValue}
      name={name}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
};

export default ProfileTextInput;
