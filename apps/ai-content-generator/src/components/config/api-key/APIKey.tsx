import { ChangeEvent, Dispatch, useState } from 'react';
import { Flex, FormControl, Spinner, Text, TextInput } from '@contentful/f36-components';
import { APIKeyText } from '../configText';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ConfigErrors } from '@components/config/configText';
import AI from '@utils/aiApi';
import { modelsBaseUrl } from '@configs/ai/baseUrl';
import { ParameterAction, ParameterReducer } from '../parameterReducer';

interface Props {
  apiKey: string;
  isInvalid: boolean;
  dispatch: Dispatch<ParameterReducer>;
}

const APIKey = (props: Props) => {
  const { apiKey, isInvalid, dispatch } = props;
  const [localApiKey, setLocalApiKey] = useState<string>(apiKey);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const displayInvalidMessage = !apiKey || isInvalid;

  const censorApiKey = (key: string) => key.replace(/.(?=.{4,}$)/g, '*');

  const validateApiKey = async (key: string): Promise<boolean> => {
    const ai = new AI(modelsBaseUrl, key, '');

    try {
      await ai.getModels();
      return true;
    } catch (e: unknown) {
      console.error(e);
      return false;
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);

    if (localApiKey === apiKey) return;

    setIsValidating(true);

    const isValid = await validateApiKey(localApiKey || apiKey);
    dispatch({ type: ParameterAction.UPDATE_APIKEY, value: localApiKey || apiKey, isValid });

    setIsValidating(false);
  };

  const handleClick = () => setIsEditing(true);

  return (
    <FormControl isRequired>
      <FormControl.Label>{APIKeyText.title}</FormControl.Label>
      {isEditing ? (
        <TextInput
          value={localApiKey}
          type="text"
          name="apikey"
          placeholder="sk-...4svb"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalApiKey(e.target.value)}
          onBlur={handleBlur}
          isInvalid={displayInvalidMessage}
        />
      ) : (
        <TextInput
          isReadOnly={true}
          value={censorApiKey(apiKey)}
          type="text"
          name="apikey"
          placeholder="sk-...4svb"
          onClick={handleClick}
          isInvalid={displayInvalidMessage}
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
      {isValidating && (
        <Flex marginTop="spacingXs">
          <Text marginRight="spacingXs">Validating API Key</Text>
          <Spinner />
        </Flex>
      )}
      {displayInvalidMessage && (
        <FormControl.ValidationMessage>{ConfigErrors.missingApiKey}</FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default APIKey;
