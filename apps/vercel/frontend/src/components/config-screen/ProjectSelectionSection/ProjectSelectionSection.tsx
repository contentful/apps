import { ChangeEvent, useContext } from 'react';

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
  const { parameters, errors, dispatchErrors, dispatchParameters, handleAppConfigurationChange } =
    useContext(ConfigPageContext);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    // indicate app config change when project has been re-selected
    handleAppConfigurationChange();

    // reset the selected api path only when the project changes
    dispatchParameters({
      type: parametersActions.APPLY_API_PATH,
      payload: '',
    });

    dispatchParameters({
      type: parametersActions.APPLY_SELECTED_PROJECT,
      payload: event.target.value,
    });

    dispatchErrors({
      type: errorsActions.RESET_PROJECT_SELECTION_ERRORS,
    });
  };

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
        handleInvalidSelectionError={handleInvalidSelectionError}
        section={sectionId}
        id={sectionId}
        error={errors.projectSelection}
        handleChange={handleChange}
      />
    </SectionWrapper>
  );
};
