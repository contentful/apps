import { ChangeEvent, Dispatch, useState } from "react";
import {
  Flex,
  FormControl,
  Spinner,
  Text,
  TextInput,
} from "@contentful/f36-components";
import { APIKeyText, AccessKeyText } from "../configText";
import HyperLink from "@components/common/HyperLink/HyperLink";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import { ConfigErrors } from "@components/config/configText";
import AI from "@utils/aiApi";
import { modelsBaseUrl } from "@configs/ai/baseUrl";
import { ParameterAction, ParameterReducer } from "../parameterReducer";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";

interface Props {
  apiKey?: string;
  accessKeyID: string;
  secretAccessKey: string;
  isInvalid: boolean;
  dispatch: Dispatch<ParameterReducer>;
}

const AccessKey = ({
  apiKey = "testtesttest",
  accessKeyID,
  secretAccessKey,
  isInvalid,
  dispatch,
}: Props) => {
  const [localAccessKeyID, setLocalAccessKeyID] = useState<string>(accessKeyID);
  const [localSecretAccessKey, setLocalSecretAccessKey] =
    useState<string>(secretAccessKey);

  // const [localApiKey, setLocalApiKey] = useState<string>(apiKey);

  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const displayInvalidMessage = !apiKey || isInvalid;

  const censorApiKey = (key: string) => key?.replace(/.(?=.{4,}$)/g, "*");

  // const validateApiKey = async (key: string): Promise<boolean> => {
    // const ai = new AI(modelsBaseUrl, key, '');

  //   try {
      // await ai.getModels();
  //     return true;
  //   } catch (e: unknown) {
  //     console.error(e);
  //     return false;
  //   }
  // };

  const validateApiKey = async () => {
    const client = new BedrockClient({
      credentials: {
        accessKeyId: localAccessKeyID,
        secretAccessKey: localSecretAccessKey,
      },
      region: "us-east-1",
    });

    try {
      const foundationModels = await client.send(
        new ListFoundationModelsCommand({}),
      );
      console.log(foundationModels);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);

    if (
      localAccessKeyID === accessKeyID &&
      localSecretAccessKey == secretAccessKey
    )
      return;

    setIsValidating(true);

    const isValid = await validateApiKey();
    // dispatch({
    //   type: ParameterAction.UPDATE_APIKEY,
    //   value: localApiKey || apiKey,
    //   isValid,
    // });

    setIsValidating(false);
  };

  const handleClick = () => setIsEditing(true);

  return (
    <>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.accessKeyIDTitle}</FormControl.Label>

        <TextInput
          value={localAccessKeyID}
          type="text"
          name="accessKeyID"
          placeholder="AKIA6O......"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setLocalAccessKeyID(e.target.value)
          }
        />

        {isValidating && (
          <Flex marginTop="spacingXs">
            <Text marginRight="spacingXs">Validating API Key</Text>
            <Spinner />
          </Flex>
        )}
        {displayInvalidMessage && (
          <FormControl.ValidationMessage>
            {ConfigErrors.missingApiKey}
          </FormControl.ValidationMessage>
        )}
      </FormControl>
      <FormControl isRequired>
        <FormControl.Label>
          {AccessKeyText.secretAccessKeyTitle}
        </FormControl.Label>

        <TextInput
          value={localSecretAccessKey}
          type="password"
          name="secretAccessKey"
          placeholder="******"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setLocalSecretAccessKey(e.target.value)
          }
          onBlur={handleBlur}
        />

        <FormControl.HelpText>
          <HyperLink
            body={AccessKeyText.helpText}
            substring={AccessKeyText.linkSubstring}
            hyperLinkHref={AccessKeyText.link}
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
          <FormControl.ValidationMessage>
            {ConfigErrors.missingApiKey}
          </FormControl.ValidationMessage>
        )}
      </FormControl>
    </>
  );
};

export default AccessKey;
