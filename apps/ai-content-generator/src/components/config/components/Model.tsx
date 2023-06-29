import { FormControl, Select } from '@contentful/f36-components';
import BetaWarning from './BetaWarning';
import { ChangeEvent, Dispatch, useEffect, useState } from 'react';
import { ParameterAction, ParameterActionTypes } from '../parameterReducer';
import { ModelText } from './ConfigText';
import useSelectModelList from '../hooks/useSelectModelList';

interface Props {
  model: string;
  dispatch: Dispatch<ParameterAction>;
}

const Model = (props: Props) => {
  const { model, dispatch } = props;
  const [isBeta, setIsBeta] = useState(false);
  const { SelectModelList } = useSelectModelList();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: ParameterActionTypes.MODEL, value: e.target.value });
  };
  const checkIsBeta = () => setIsBeta(!!model.match(/gpt-4/));

  useEffect(checkIsBeta, [model]);

  return (
    <FormControl>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Select value={model} onChange={handleChange}>
        {SelectModelList}
      </Select>

      {isBeta && <BetaWarning />}

      <FormControl.HelpText>{ModelText.helpText}</FormControl.HelpText>
    </FormControl>
  );
};

export default Model;
