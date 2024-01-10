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
import { styles } from "./AccessKey.styles";

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
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);

  const validateCredentials = async () => {
    try {
      const ai = new AI(localAccessKeyID, localSecretAccessKey, "us-east-1");
      await ai.getModels();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);
    console.log("handleBlur");

    if (
      localAccessKeyID === accessKeyID &&
      localSecretAccessKey == secretAccessKey
    )
      return console.log("no change");

    setIsValidating(true);
    const isValid = localSecretAccessKey != "" && (await validateCredentials());

    console.log("isValid", isValid);

    dispatch({
      type: ParameterAction.UPDATE_CREDENTIALS,
      value: {
        accessKeyId: localAccessKeyID || accessKeyID,
        secretAccessKey: localSecretAccessKey || secretAccessKey,
      },
      isValid,
    });

    setIsValidating(false);
    setShowValidation(true);
  };

  const secretAccessKeyError = !localSecretAccessKey
    ? ConfigErrors.missingSecretAccessKey
    : isInvalid
      ? ConfigErrors.invalidCredentials
      : null;

  return (
    <>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.accessKeyIDTitle}</FormControl.Label>

        <TextInput
          value={localAccessKeyID}
          type="text"
          name="accessKeyID"
          placeholder="AKIA6O......"
          onMouseDown={() => setIsEditing(true)}
          onChange={(e) => setLocalAccessKeyID(e.target.value)}
          onBlur={handleBlur}
        />

        {showValidation && !isEditing && !localAccessKeyID && (
          <FormControl.ValidationMessage>
            {ConfigErrors.missingAccessKeyID}
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
          onMouseDown={() => setIsEditing(true)}
          onChange={(e) => setLocalSecretAccessKey(e.target.value)}
          onBlur={handleBlur}
          // detect paste
          // onPaste={(e) => {
          //   console.log("secret access key");
          //   handleBlur();
          //   setIsEditing(true);
          // }}
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
        {showValidation &&
          !isValidating &&
          secretAccessKeyError &&
          !isEditing && (
            <FormControl.ValidationMessage>
              {secretAccessKeyError}
            </FormControl.ValidationMessage>
          )}

        {!isInvalid && !isValidating && (
          <p css={styles.successMessage}>Credentials are Valid! 🎉</p>
        )}
      </FormControl>
    </>
  );
};

export default AccessKey;
