import { ChangeEvent, Dispatch } from 'react';
import { FormControl, Select } from '@contentful/f36-components';
import { ModelText } from '../configText';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import { ConfigErrors } from '../configText';
import { defaultModelId } from '@configs/ai/gptModels';

const GPT_MODELS = [
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-4o-mini',
];

interface Props {
  model: string;
  dispatch: Dispatch<ParameterReducer>;
}

const Model = ({ model, dispatch }: Props) => {
  const isInvalid = !model;
  const value = GPT_MODELS.includes(model) ? model : defaultModelId;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: ParameterAction.UPDATE_MODEL, value: e.target.value });
  };

  return (
    <FormControl isRequired marginBottom="none" isInvalid={isInvalid}>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Select value={value} onChange={handleChange}>
        {GPT_MODELS.map((id) => (
          <Select.Option key={id} value={id}>
            {id}
          </Select.Option>
        ))}
      </Select>
      <FormControl.HelpText>{ModelText.helpText}</FormControl.HelpText>
      {isInvalid && (
        <FormControl.ValidationMessage>{ConfigErrors.missingModel}</FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Model;
