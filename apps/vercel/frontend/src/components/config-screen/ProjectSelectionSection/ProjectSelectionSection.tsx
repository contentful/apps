import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { AppInstallationParameters, Project } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import { actions, singleSelectionSections } from '@constants/enums';

interface Props {
  parameters: AppInstallationParameters;
  projects: Project[];
  dispatch: Dispatch<ParameterAction>;
}

export const ProjectSelectionSection = ({ parameters, dispatch, projects }: Props) => {
  const sectionId = singleSelectionSections.PROJECT_SELECTION_SECTION;
  return (
    <SectionWrapper testId={sectionId}>
      <SelectSection
        selectedOption={parameters.selectedProject}
        options={projects}
        action={actions.APPLY_SELECTED_PROJECT}
        dispatch={dispatch}
        section={sectionId}
        id={sectionId}
      />
    </SectionWrapper>
  );
};
