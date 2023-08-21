import { ChangeEvent, Dispatch, useState } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { APIKeyText } from '../configText';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface Props {
  apiKey: string;
  dispatch: Dispatch<ParameterReducer>;
}

const APIKey = (props: Props) => {
  const { apiKey, dispatch } = props;
  const [editing, setEditing] = useState(false);

  const censorApiKey = (key: string) => key.replace(/.(?=.{4,}$)/g, '*');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: ParameterAction.UPDATE_APIKEY, value: e.target.value });
  };

  const handleBlur = () => {
    setEditing(false);
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
      <FormControl.HelpText>
        <HyperLink
          body={APIKeyText.helpText}
          substring={APIKeyText.linkSubstring}
          hyperLinkHref={APIKeyText.link}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </FormControl.HelpText>
    </FormControl>
  );
};

export default APIKey;
