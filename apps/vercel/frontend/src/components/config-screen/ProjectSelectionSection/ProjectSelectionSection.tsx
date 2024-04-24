import { useContext } from 'react';

import { Project } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import { actions, singleSelectionSections } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';

interface Props {
  projects: Project[];
}

export const ProjectSelectionSection = ({ projects }: Props) => {
  const sectionId = singleSelectionSections.PROJECT_SELECTION_SECTION;
  const { parameters } = useContext(ConfigPageContext);

  return (
    <SectionWrapper testId={sectionId}>
      <SelectSection
        selectedOption={parameters.selectedProject}
        options={projects}
        action={actions.APPLY_SELECTED_PROJECT}
        section={sectionId}
        id={sectionId}
      />
    </SectionWrapper>
  );
};
