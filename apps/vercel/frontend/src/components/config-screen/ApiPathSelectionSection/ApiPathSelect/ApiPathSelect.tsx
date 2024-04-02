import { ChangeEvent, Dispatch } from 'react';
import { Box, FormControl, Select } from '@contentful/f36-components';

import { ParameterAction, actions } from '@components/parameterReducer';
import { AppInstallationParameters, Path } from '@customTypes/configPage';
import { styles } from './ApiPathSelect.styles';

interface Props {
  parameters: AppInstallationParameters;
  paths: Path[];
  dispatch: Dispatch<ParameterAction>;
}

export const ApiPathSelect = ({ parameters, paths, dispatch }: Props) => {
  const handleProjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_API_PATH,
      payload: event.target.value,
    });
  };

  const { selectedApiPath } = parameters;

  return (
    <Box>
      <FormControl className={styles.formControl} id="pathSelect" isRequired={true}>
        <FormControl.Label>API Path</FormControl.Label>
        <Select
          id="pathSelect"
          name="pathSelect"
          value={selectedApiPath}
          onChange={handleProjectChange}>
          {paths && paths.length ? (
            <>
              <Select.Option value="" isDisabled>
                Please select an API path...
              </Select.Option>
              {paths.map((path) => (
                <Select.Option key={`option-${path.id}`} value={path.id}>
                  {path.name}
                </Select.Option>
              ))}
            </>
          ) : (
            <Select.Option value="">No paths currently configured.</Select.Option>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};
