import { ChangeEvent, useState } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';
import OpenAILink from 'components/config/OpenAILink/OpenAILink';

interface Props {
  apiKey?: string;
  handleApiKey: (value: { apiKey: string }) => void;
}

export const TITLE = 'Open AI Key';
export const BODY = 'Provide your Open AI API key. If you need to generate a key, visit openai.com';
export const SUBSTRING = 'visit openai.com';

const APIKey = (props: Props) => {
  const { apiKey, handleApiKey } = props;
  const [editing, setEditing] = useState(false);

  const censorApiKey = (key: string) => key.replace(/.(?=.{4,}$)/g, '*');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleApiKey({ apiKey: e.target.value });
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const handleClick = () => setEditing(true);

  return (
    <FormControl testId="api-key-section" isRequired>
      <FormControl.Label>{TITLE}</FormControl.Label>
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
          value={apiKey ? censorApiKey(apiKey) : undefined}
          type="text"
          name="apikey"
          placeholder="sk-...4svb"
          onClick={handleClick}
        />
      )}
      <FormControl.HelpText>
        <OpenAILink body={BODY} substring={SUBSTRING} />
      </FormControl.HelpText>
    </FormControl>
  );
};

export default APIKey;
