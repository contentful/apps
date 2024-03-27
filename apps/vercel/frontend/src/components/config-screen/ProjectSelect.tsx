import { ChangeEvent, Dispatch, SetStateAction, useEffect } from 'react';
import { Box, FormControl, Select } from '@contentful/f36-components';
import { AppInstallationParameters } from '../../types';
import { actions } from '../parameterReducer';

const ProjectSelect = ({
  parameters,
  dispatch,
}: {
  parameters: AppInstallationParameters;
  dispatch: Dispatch<SetStateAction<any>>;
}) => {
  const handleProjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_SELECTED_PROJECT,
      payload: event.target.value,
    });
  };

  const { selectedProject, projects } = parameters;

  return (
    <Box>
      <FormControl id="optionProjectSelect" isRequired={true}>
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

export default ProjectSelect;
