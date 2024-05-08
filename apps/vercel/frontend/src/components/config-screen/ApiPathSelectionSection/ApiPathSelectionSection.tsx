import { useContext, ChangeEvent } from 'react';
import { Path } from '@customTypes/configPage';
import { SectionWrapper } from '@components/common/SectionWrapper/SectionWrapper';
import { SelectSection } from '@components/common/SelectSection/SelectSection';
import {
  errorTypes,
  errorsActions,
  parametersActions,
  singleSelectionSections,
} from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { TextFieldSection } from './TextFieldSection/TextFieldSection';
import { DraftModeHelpText } from './HelpText/HelpText';

interface Props {
  paths: Path[];
}

export const ApiPathSelectionSection = ({ paths }: Props) => {
  const sectionId = singleSelectionSections.API_PATH_SELECTION_SECTION;
  const { parameters, isLoading, dispatchErrors, errors, dispatchParameters } =
    useContext(ConfigPageContext);
  const { invalidDeploymentData, cannotFetchApiPaths, apiPathNotFound } = errors.apiPathSelection;

  const selectedOption = apiPathNotFound ? '' : parameters.selectedApiPath;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatchParameters({
      type: parametersActions.APPLY_API_PATH,
      payload: event.target.value,
    });

    dispatchErrors({
      type: errorsActions.RESET_API_PATH_SELECTION_ERRORS,
    });
  };

  const handlePathNotFoundError = () => {
    dispatchErrors({
      type: errorsActions.UPDATE_API_PATH_SELECTION_ERRORS,
      payload: errorTypes.API_PATH_NOT_FOUND,
    });
  };

  const renderInput = () => {
    if ((paths.length === 0 && !isLoading) || invalidDeploymentData || cannotFetchApiPaths) {
      return <TextFieldSection />;
    }

    return (
      <SelectSection
        selectedOption={selectedOption}
        options={paths}
        handleNotFoundError={handlePathNotFoundError}
        handleChange={handleChange}
        section={sectionId}
        id={sectionId}
        helpText={<DraftModeHelpText />}
        error={errors.apiPathSelection}
      />
    );
  };

  return <SectionWrapper testId={sectionId}>{renderInput()}</SectionWrapper>;
};
