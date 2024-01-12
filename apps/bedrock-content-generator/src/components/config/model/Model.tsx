import { FoundationModelSummary } from "@aws-sdk/client-bedrock";
import { FormControl, Select } from "@contentful/f36-components";
import AI from "@utils/aiApi";
import { ChangeEvent, Dispatch, useEffect, useMemo, useState } from "react";
import { ConfigErrors, ModelText } from "../configText";
import { ParameterAction, ParameterReducer } from "../parameterReducer";

interface Props {
  model: string;
  dispatch: Dispatch<ParameterReducer>;
  region: string;
  credentials: {
    accessKeyID: string;
    secretAccessKey: string;
  };
  credentialsValid: boolean;
}

const Model = ({
  credentials,
  credentialsValid,
  model,
  region,
  dispatch,
}: Props) => {
  const ai = useMemo(
    () =>
      credentialsValid && credentials.accessKeyID && credentials.secretAccessKey
        ? new AI(credentials.accessKeyID, credentials.secretAccessKey, region)
        : null,
    [credentials, credentialsValid, region],
  );

  const [models, setModels] = useState<FoundationModelSummary[]>([]);

  useEffect(() => {
    if (!ai) return;
    ai.getModels().then((models) => {
      setModels(models.filter((m) => m.responseStreamingSupported));
    });
  }, [ai]);

  const modelList = models.map((model) => (
    <Select.Option key={model.modelId} value={model.modelId}>
      {model.providerName} {model.modelName} {model.modelId}
    </Select.Option>
  ));

  const isInvalid = !model;
  const isSelectionInModelList = models.some(
    (modelOption) => modelOption.modelId === model,
  );
  const value = isSelectionInModelList ? model : "";

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: ParameterAction.UPDATE_MODEL, value: e.target.value });
  };

  return (
    <FormControl isRequired marginBottom="none" isInvalid={isInvalid}>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Select
        value={value}
        onChange={handleChange}
        isDisabled={models.length < 1}
      >
        {modelList}
      </Select>

      <FormControl.HelpText>{ModelText.helpText}</FormControl.HelpText>
      {isInvalid && (
        <FormControl.ValidationMessage>
          {ConfigErrors.missingModel}
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Model;
