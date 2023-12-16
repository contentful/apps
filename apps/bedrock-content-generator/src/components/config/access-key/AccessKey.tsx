import HyperLink from "@components/common/HyperLink/HyperLink";
import { ConfigErrors } from "@components/config/configText";
import {
  Flex,
  FormControl,
  Spinner,
  Text,
  TextInput,
} from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import AI from "@utils/aiApi";
import { Dispatch, useState } from "react";
import { AccessKeyText } from "../configText";
import { ParameterAction, ParameterReducer } from "../parameterReducer";

interface Props {
  apiKey?: string;
  accessKeyID: string;
  secretAccessKey: string;
  isInvalid: boolean;
  dispatch: Dispatch<ParameterReducer>;
}

const AccessKey = ({
  accessKeyID,
  secretAccessKey,
  isInvalid,
  dispatch,
}: Props) => {
  const [localAccessKeyID, setLocalAccessKeyID] = useState<string>(accessKeyID);
  const [localSecretAccessKey, setLocalSecretAccessKey] =
    useState<string>(secretAccessKey);

  const [isValidating, setIsValidating] = useState<boolean>(false);
  // const displayInvalidMessage = !apiKey || isInvalid;

  const validateCredentials = async () => {
    const ai = new AI(localAccessKeyID, localSecretAccessKey);

    try {
      ai.getModels();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const handleBlur = async () => {
    if (
      localAccessKeyID === accessKeyID &&
      localSecretAccessKey == secretAccessKey
    )
      return;

    setIsValidating(true);

    const isValid = await validateCredentials();

    dispatch({
      type: ParameterAction.UPDATE_CREDENTIALS,
      value: {
        accessKeyId: localAccessKeyID || accessKeyID,
        secretAccessKey: localSecretAccessKey || secretAccessKey,
      },
      isValid,
    });

    setIsValidating(false);
  };

  return (
    <>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.accessKeyIDTitle}</FormControl.Label>

        <TextInput
          value={localAccessKeyID}
          type="text"
          name="accessKeyID"
          placeholder="AKIA6O......"
          onChange={(e) => setLocalAccessKeyID(e.target.value)}
        />

        {/* {displayInvalidMessage && (
          <FormControl.ValidationMessage>
            {ConfigErrors.missingApiKey}
          </FormControl.ValidationMessage>
        )} */}
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
          onChange={(e) => setLocalSecretAccessKey(e.target.value)}
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
        {/* {displayInvalidMessage && (
          <FormControl.ValidationMessage>
            {ConfigErrors.missingApiKey}
          </FormControl.ValidationMessage>
        )} */}
      </FormControl>
    </>
  );
};

export default AccessKey;
