import { useContext } from 'react';

import { Project } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import {
  errorTypes,
  errorsActions,
  parametersActions,
  singleSelectionSections,
} from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';

interface Props {
  projects: Project[];
}

export const ProjectSelectionSection = ({ projects }: Props) => {
  const sectionId = singleSelectionSections.PROJECT_SELECTION_SECTION;
  const { parameters, errors, dispatchErrors } = useContext(ConfigPageContext);

  const handleInvalidSelectionError = () => {
    dispatchErrors({
      type: errorsActions.UPDATE_PROJECT_SELECTION_ERRORS,
      payload: errorTypes.PROJECT_NOT_FOUND,
    });
  };

  return (
    <SectionWrapper testId={sectionId}>
      <SelectSection
        selectedOption={parameters.selectedProject}
        options={projects}
        parameterAction={parametersActions.APPLY_SELECTED_PROJECT}
        handleInvalidSelectionError={handleInvalidSelectionError}
        section={sectionId}
        id={sectionId}
        error={errors.projectSelection}
      />
    </SectionWrapper>
  );
};
