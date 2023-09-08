import { ChangeEvent, Dispatch, useEffect, useState } from 'react';
import { Textarea } from '@contentful/f36-components';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { useDebounce } from 'usehooks-ts';

interface Props {
  value: string;
  name: string;
  id: string;
  placeholder: string;
  dispatch: Dispatch<ParameterReducer>;
}

const TEXTAREA_ROWS = 5;

const ProfileTextArea = (props: Props) => {
  const { value, name, id, placeholder, dispatch } = props;
  const [fieldValue, setFieldValue] = useState('');
  const debouncedValue = useDebounce<string>(fieldValue, 300);

  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  useEffect(() => {
    dispatch({ type: ParameterAction.UPDATE_PROFILE, value: debouncedValue, field: id });
  }, [debouncedValue, dispatch, id]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFieldValue(e.target.value);
  };

  return (
    <Textarea
      rows={TEXTAREA_ROWS}
      resize="none"
      value={fieldValue}
      name={name}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
};

export default ProfileTextArea;
