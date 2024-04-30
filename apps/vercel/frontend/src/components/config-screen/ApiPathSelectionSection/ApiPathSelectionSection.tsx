import { useContext, useState, useEffect } from 'react';
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
import { HelpText, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface Props {
  paths: Path[];
}

export const ApiPathSelectionSection = ({ paths }: Props) => {
  const [renderSelect, setRenderSelect] = useState(false);
  const sectionId = singleSelectionSections.API_PATH_SELECTION_SECTION;
  const { parameters, isLoading, dispatchErrors, errors } = useContext(ConfigPageContext);

  const handleInvalidSelectionError = () => {
    dispatchErrors({
      type: errorsActions.UPDATE_API_PATH_SELECTION_ERRORS,
      payload: errorTypes.API_PATH_NOT_FOUND,
    });
  };

  useEffect(() => {
    setRenderSelect(paths.length > 0 || isLoading);
  }, [paths, isLoading]);

  const helpText = (
    <HelpText>
      Select the route from your application that enables Draft Mode. See our{' '}
      <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href="http://www.example.com"
        target="_blank"
        rel="noopener noreferrer">
        Vercel developer guide
      </TextLink>{' '}
      for instructions on setting up a Draft Mode route handler. UPDATE LINK
    </HelpText>
  );

  return (
    <SectionWrapper testId={sectionId}>
      {renderSelect ? (
        <SelectSection
          selectedOption={parameters.selectedApiPath}
          options={paths}
          parameterAction={parametersActions.APPLY_API_PATH}
          handleInvalidSelectionError={handleInvalidSelectionError}
          section={sectionId}
          id={sectionId}
          helpText={helpText}
          error={errors.apiPathSelection}
        />
      ) : (
        <TextFieldSection value={parameters.selectedApiPath} />
      )}
    </SectionWrapper>
  );
};
