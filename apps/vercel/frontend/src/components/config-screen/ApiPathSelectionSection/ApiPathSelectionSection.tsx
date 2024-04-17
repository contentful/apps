import { useContext } from 'react';

import { Path } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import { actions, singleSelectionSections } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';

interface Props {
  paths: Path[];
}

export const ApiPathSelectionSection = ({ paths }: Props) => {
  const sectionId = singleSelectionSections.API_PATH_SELECTION_SECTION;
  const { dispatch, parameters } = useContext(ConfigPageContext);

  return (
    <SectionWrapper testId={sectionId}>
      <SelectSection
        selectedOption={parameters.selectedApiPath}
        options={paths}
        action={actions.APPLY_API_PATH}
        dispatch={dispatch}
        section={sectionId}
        id={sectionId}
      />
    </SectionWrapper>
  );
};
