import { Box, HelpText } from '@contentful/f36-components';
import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { copies } from '@constants/copies';
import { AppInstallationParameters, Project } from '@customTypes/configPage';
import { ProjectSelect } from './ProjectSelect/ProjectSelect';
import { styles } from './ProjectSelectionSection.styles';

interface Props {
  parameters: AppInstallationParameters;
  projects: Project[];
  dispatch: Dispatch<ParameterAction>;
}

export const ProjectSelectionSection = ({ parameters, dispatch, projects }: Props) => {
  const { helpText } = copies.configPage.projectSelectionSection;
  return (
    <Box data-testid="project-selection-section" className={styles.box}>
      <ProjectSelect parameters={parameters} dispatch={dispatch} projects={projects} />
      <HelpText className={styles.helpText}>{helpText}</HelpText>
    </Box>
  );
};
