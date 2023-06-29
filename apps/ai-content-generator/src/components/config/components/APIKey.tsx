import { FormControl, TextInput } from '@contentful/f36-components';
import { ChangeEvent, Dispatch, useState } from 'react';
import { ParameterAction, ParameterActionTypes } from '../parameterReducer';
import { APIKeyText } from './ConfigText';

interface Props {
  apiKey: string;
  dispatch: Dispatch<ParameterAction>;
}

const APIKey = (props: Props) => {
  const { apiKey, dispatch } = props;
  const [editing, setEditing] = useState(false);

  const censorApiKey = (key: string) => key.replace(/.(?=.{4,}$)/g, '*');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: ParameterActionTypes.APIKEY, value: e.target.value });
  };
  const handleBlur = () => setEditing(false);
  const handleClick = () => setEditing(true);

  return (
    <FormControl isRequired>
      <FormControl.Label>{APIKeyText.title}</FormControl.Label>
      {editing ? (
        <TextInput
          value={apiKey}
          type="text"
          name="apikey"
          placeholder="sk-...4svb"
          onChange={handleChange}
          onBlur={handleBlur}
        />
      ) : (
        <TextInput
          isReadOnly={true}
          value={censorApiKey(apiKey)}
          type="text"
          name="apikey"
          placeholder="sk-...4svb"
          onClick={handleClick}
        />
      )}
      <FormControl.HelpText>{APIKeyText.helpText}</FormControl.HelpText>
      {!apiKey && (
        <FormControl.ValidationMessage>
          {APIKeyText.validationMessage}
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default APIKey;
