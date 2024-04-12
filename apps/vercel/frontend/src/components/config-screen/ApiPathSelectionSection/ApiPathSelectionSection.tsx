import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { AppInstallationParameters, Path } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import { actions, singleSelectionSections } from '@constants/enums';

interface Props {
  parameters: AppInstallationParameters;
  paths: Path[];
  dispatch: Dispatch<ParameterAction>;
}

export const ApiPathSelectionSection = ({ parameters, dispatch, paths }: Props) => {
  const sectionId = singleSelectionSections.API_PATH_SELECTION_SECTION;
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
