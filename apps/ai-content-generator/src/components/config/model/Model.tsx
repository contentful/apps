import { ChangeEvent, Dispatch } from 'react';
import { FormControl, Select } from '@contentful/f36-components';
import { gptModels, defaultModelId } from '@configs/gptModels';
import { ModelText } from '../configText';
import { ParameterAction, ParameterReducer } from '../parameterReducer';

interface Props {
  model: string;
  dispatch: Dispatch<ParameterReducer>;
}

const Model = (props: Props) => {
  const { model, dispatch } = props;

  const modelList = gptModels.map((model) => (
    <Select.Option key={model.id} value={model.id}>
      {model.name}
    </Select.Option>
  ));

  const isSelectionInModelList = gptModels.some((modelOption) => modelOption.id === model);
  const value = isSelectionInModelList ? model : defaultModelId;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: ParameterAction.UPDATE_MODEL, value: e.target.value });
  };

  return (
    <FormControl>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Select value={value} onChange={handleChange}>
        {modelList}
      </Select>

      <FormControl.HelpText>{ModelText.helpText}</FormControl.HelpText>
    </FormControl>
  );
};

export default Model;
