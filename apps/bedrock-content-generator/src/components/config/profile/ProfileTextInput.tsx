import { ChangeEvent, Dispatch, useEffect, useState } from 'react';
import { TextInput } from '@contentful/f36-components';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { useDebounce } from 'usehooks-ts';
import TextCounter from '@components/common/text-counter/TextCounter';
import { ProfileFields } from '../appInstallationParameters';

interface Props {
  value: string;
  name: string;
  id: string;
  placeholder: string;
  textLimit: number;
  dispatch: Dispatch<ParameterReducer>;
}

const ProfileTextInput = (props: Props) => {
  const { value, name, id, placeholder, textLimit, dispatch } = props;
  const [fieldValue, setFieldValue] = useState('');
  const debouncedValue = useDebounce<string>(fieldValue, 300);

  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  useEffect(() => {
    if (id === ProfileFields.PROFILE) {
      dispatch({ type: ParameterAction.UPDATE_PROFILE, value: debouncedValue, textLimit });
    } else {
      dispatch({
        type: ParameterAction.UPDATE_BRAND_PROFILE,
        value: debouncedValue,
        field: id,
        textLimit,
      });
    }
  }, [debouncedValue, dispatch, id, textLimit]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFieldValue(e.target.value);
  };

  return (
    <>
      <TextInput
        type="text"
        value={fieldValue}
        name={name}
        placeholder={placeholder}
        onChange={handleChange}
      />
      <TextCounter text={fieldValue} maxLength={textLimit}></TextCounter>
    </>
  );
};

export default ProfileTextInput;
