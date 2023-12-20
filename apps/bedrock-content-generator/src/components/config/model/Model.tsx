import { ChangeEvent, Dispatch, useEffect, useMemo, useState } from "react";
import { FormControl, Select } from "@contentful/f36-components";
import { gptModels, defaultModelId } from "@configs/ai/gptModels";
import { ModelText } from "../configText";
import { ParameterAction, ParameterReducer } from "../parameterReducer";
import { ConfigErrors } from "../configText";
import AI from "@utils/aiApi";
import { FoundationModelSummary } from "@aws-sdk/client-bedrock";

interface Props {
  model: string;
  dispatch: Dispatch<ParameterReducer>;
  credentials: {
    accessKeyID: string;
    secretAccessKey: string;
  };
  credentialsValid: boolean;
}

const Model = ({ credentials, credentialsValid, model, dispatch }: Props) => {
  const ai = useMemo(
    () =>
      credentialsValid && credentials.accessKeyID && credentials.secretAccessKey
        ? new AI(credentials.accessKeyID, credentials.secretAccessKey)
        : null,
    [credentials, credentialsValid],
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
      {model.providerName} {model.modelName}
    </Select.Option>
  ));

  const isInvalid = !model;
  const isSelectionInModelList = gptModels.some(
    (modelOption) => modelOption.id === model,
  );
  const value = isSelectionInModelList ? model : defaultModelId;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: ParameterAction.UPDATE_MODEL, value: e.target.value });
  };

  return (
    <FormControl isRequired marginBottom="none" isInvalid={isInvalid}>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Select value={value} onChange={handleChange}>
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
