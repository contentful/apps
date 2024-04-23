import { useContext, useState, useEffect } from 'react';

import { Path } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import { actions, singleSelectionSections } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { TextFieldSection } from './TextFieldSection/TextFieldSection';

interface Props {
  paths: Path[];
}

export const ApiPathSelectionSection = ({ paths }: Props) => {
  const [renderSelect, setRenderSelect] = useState(false);
  const sectionId = singleSelectionSections.API_PATH_SELECTION_SECTION;
  const { parameters, isLoading } = useContext(ConfigPageContext);

  useEffect(() => {
    setRenderSelect(paths.length > 0 || isLoading);
  }, [paths, isLoading]);

  return (
    <SectionWrapper testId={sectionId}>
      {renderSelect ? (
        <SelectSection
          selectedOption={parameters.selectedApiPath}
          options={paths}
          action={actions.APPLY_API_PATH}
          section={sectionId}
          id={sectionId}
        />
      ) : (
        <TextFieldSection value={parameters.selectedApiPath} />
      )}
    </SectionWrapper>
  );
};
