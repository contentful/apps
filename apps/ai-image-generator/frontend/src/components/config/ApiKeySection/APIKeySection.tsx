import { ChangeEvent, useState } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';
import OpenAILink from 'components/config/Hyperlink/Hyperlink';
import configPageCopies from 'constants/configPageCopies';

interface Props {
  apiKey?: string;
  handleApiKey: (value: { apiKey: string }) => void;
}

const APIKeySection = (props: Props) => {
  const { apiKey, handleApiKey } = props;
  const [editing, setEditing] = useState(false);

  const { sectionTitle, linkBody, linkSubstring, linkHref } = configPageCopies.apiKeySection

  const censorApiKey = (key: string) => key.replace(/.(?=.{4,}$)/g, '*');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleApiKey({ apiKey: e.target.value });
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const handleClick = () => setEditing(true);

  return (
    <FormControl testId='api-key-section' isRequired>
      <FormControl.Label>{sectionTitle}</FormControl.Label>
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
        <OpenAILink body={linkBody} substring={linkSubstring} href={linkHref} />
      </FormControl.HelpText>
    </FormControl>
  );
};

export default APIKeySection;
