import { ChangeEvent, Dispatch } from 'react';

import { ParameterAction, actions } from '@components/parameterReducer';
import { AppInstallationParameters, Project } from '@customTypes/configPage';
import { Select } from '@components/common/Select/Select';
import { copies } from '@constants/copies';
import { FormControl } from '@contentful/f36-components';

interface Props {
  parameters: AppInstallationParameters;
  projects: Project[];
  dispatch: Dispatch<ParameterAction>;
}

export const ProjectSelect = ({ parameters, projects, dispatch }: Props) => {
  const { placeholder, label, emptyMessage } = copies.configPage.projectSelectionSection.dropdown;
  const handleProjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_SELECTED_PROJECT,
      payload: event.target.value,
    });
  };

  const { selectedProject } = parameters;

  return (
    <FormControl marginBottom="spacingS" id="projectSelect" isRequired={true}>
      <Select
        value={selectedProject}
        onChange={handleProjectChange}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        options={projects}
        label={label}
      />
    </FormControl>
  );
};
