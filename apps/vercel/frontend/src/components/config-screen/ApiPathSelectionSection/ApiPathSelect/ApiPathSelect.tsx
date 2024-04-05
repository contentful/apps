import { ChangeEvent, Dispatch } from 'react';

import { ParameterAction, actions } from '@components/parameterReducer';
import { Select } from '@components/common/Select/Select';
import { AppInstallationParameters, Path } from '@customTypes/configPage';
import { copies } from '@constants/copies';

interface Props {
  parameters: AppInstallationParameters;
  paths: Path[];
  dispatch: Dispatch<ParameterAction>;
}

export const ApiPathSelect = ({ parameters, paths, dispatch }: Props) => {
  const { placeholder, label, emptyMessage } = copies.configPage.pathSelectionSection.dropdown;
  const handlePathChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_API_PATH,
      payload: event.target.value,
    });
  };

  const { selectedApiPath } = parameters;

  return (
    <Select
      value={selectedApiPath}
      onChange={handlePathChange}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      options={paths}
      label={label}
    />
  );
};
