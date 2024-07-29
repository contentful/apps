import { ChangeEvent, Dispatch, useEffect, useState } from 'react';
import { FormControl, Select } from '@contentful/f36-components';
import { getGptModels, defaultModelId } from '@configs/ai/gptModels';
import { ModelText } from '../configText';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { ConfigErrors } from '../configText';
import { Model as OpenAiModel } from 'openai';

interface Props {
  apiKey: string;
  model: string;
  dispatch: Dispatch<ParameterReducer>;
}

const Model = (props: Props) => {
  const { apiKey, model, dispatch } = props;
  const [gptModels, setGptModels] = useState<OpenAiModel[]>([]);

  useEffect(() => {
    async function fetchGptModels() {
      if (!apiKey) return;
      if (gptModels.length) return;
      const models = await getGptModels(apiKey);
      setGptModels(models.sort((a, b) => a.id.localeCompare(b.id)));
    }
    fetchGptModels();
  }, [apiKey, gptModels]);

  const modelList = gptModels.map((model) => (
    <Select.Option key={model.id} value={model.id}>
      {model.id}
    </Select.Option>
  ));

  const isInvalid = !model;
  const isSelectionInModelList = gptModels.some((modelOption) => modelOption.id === model);
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
        <FormControl.ValidationMessage>{ConfigErrors.missingModel}</FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Model;
