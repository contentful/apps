import { ChangeEvent, Dispatch } from 'react';
import { Box, FormControl, Select } from '@contentful/f36-components';

import { ParameterAction, actions } from '@components/parameterReducer';
import { AppInstallationParameters, Project } from '../../../../types';
import { styles } from './ProjectSelect.styles';

interface Props {
  parameters: AppInstallationParameters;
  projects: Project[];
  dispatch: Dispatch<ParameterAction>;
}

export const ProjectSelect = ({ parameters, projects, dispatch }: Props) => {
  const handleProjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_SELECTED_PROJECT,
      payload: event.target.value,
    });
  };

  const { selectedProject } = parameters;

  return (
    <Box>
      <FormControl className={styles.formControl} id="optionProjectSelect" isRequired={true}>
        <FormControl.Label>Project</FormControl.Label>
        <Select
          id="optionProjectSelect"
          name="optionProjectSelect"
          value={selectedProject}
          onChange={handleProjectChange}>
          {projects && projects.length ? (
            <>
              <Select.Option value="" isDisabled>
                Please select a project...
              </Select.Option>
              {projects.map((project) => (
                <Select.Option key={`option-${project.id}`} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </>
          ) : (
            <Select.Option value="">No Projects currently configured.</Select.Option>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};
