import { ChangeEvent, Dispatch, useState } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { APIKeyText } from '../configText';

interface Props {
  apiKey: string;
  dispatch: Dispatch<ParameterReducer>;
}

const APIKey = (props: Props) => {
  const { apiKey, dispatch } = props;
  const [editing, setEditing] = useState(false);
  const [isTouched, setisTouched] = useState(false);

  const censorApiKey = (key: string) => key.replace(/.(?=.{4,}$)/g, '*');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: ParameterAction.APIKEY, value: e.target.value });
  };
  const handleBlur = () => {
    setEditing(false);
    setisTouched(true);
  };
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
      {!apiKey && isTouched && (
        <FormControl.ValidationMessage>
          {APIKeyText.validationMessage}
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default APIKey;
