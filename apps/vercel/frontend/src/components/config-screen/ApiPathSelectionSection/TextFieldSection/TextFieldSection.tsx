import { useContext, useEffect, useMemo } from 'react';

import { copies } from '@constants/copies';
import { FormControl, TextInput } from '@contentful/f36-components';
import { errorsActions, parametersActions, singleSelectionSections } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { SelectionWrapper } from '@components/common/SelectionWrapper/SelectionWrapper';
import { debounce } from 'lodash';
import { useError } from '@hooks/useError/useError';
import { DraftModeHelpText } from '../DraftModeHelpText/DraftModeHelpText';

export const TextFieldSection = () => {
  const { textInputPlaceholder, label } = copies.configPage.pathSelectionSection;
  const { isLoading, dispatchParameters, dispatchErrors, parameters, errors } =
    useContext(ConfigPageContext);
  const { isError, message } = useError({ error: errors.apiPathSelection });

  const resetApiPathSelectionErrors = () => {
    dispatchErrors({
      type: errorsActions.RESET_API_PATH_SELECTION_ERRORS,
    });
  };

  const handleApiPathInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatchParameters({
      type: parametersActions.APPLY_API_PATH,
      payload: event.target.value,
    });

    resetApiPathSelectionErrors();
  };

  const debouncedHandleApiPathInputChange = useMemo(() => debounce(handleApiPathInput, 700), []);

  useEffect(() => {
    if (parameters.selectedApiPath && errors.apiPathSelection.apiPathsEmpty)
      resetApiPathSelectionErrors();
  }, [parameters.selectedApiPath, errors.apiPathSelection.apiPathsEmpty]);

  return (
    <FormControl
      marginBottom="spacingS"
      id={singleSelectionSections.API_PATH_SELECTION_SECTION}
      isRequired={true}>
      <SelectionWrapper
        label={label}
        isLoading={isLoading}
        isRequired={true}
        errorMessage={message}
        helpText={<DraftModeHelpText />}>
        <TextInput
          defaultValue={parameters.selectedApiPath}
          onChange={debouncedHandleApiPathInputChange}
          placeholder={textInputPlaceholder}
          isInvalid={isError}
          data-testid="apiPathInput"
        />
      </SelectionWrapper>
    </FormControl>
  );
};
