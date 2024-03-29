import { Box, Heading, Paragraph, TextLink } from '@contentful/f36-components';
import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { copies } from '@constants/copies';
import { AppInstallationParameters, Project } from '@customTypes/configPage';
import { styles } from '../ConfigScreen.styles';
import { ProjectSelect } from './ProjectSelect/ProjectSelect';

interface Props {
  parameters: AppInstallationParameters;
  projects: Project[];
  dispatch: Dispatch<ParameterAction>;
}

export const ProjectSelectionSection = ({ parameters, dispatch, projects }: Props) => {
  const { heading, subHeading, link, footer } = copies.configPage.projectSelectionSection;
  return (
    <Box className={styles.box}>
      <Heading marginBottom="none" className={styles.heading}>
        {heading}
      </Heading>
      <Paragraph marginTop="spacingXs">
        {subHeading} <TextLink>{link}</TextLink>
      </Paragraph>
      <ProjectSelect parameters={parameters} dispatch={dispatch} projects={projects} />
      <Paragraph>{footer}</Paragraph>
    </Box>
  );
};
