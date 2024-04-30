import { ChangeEvent, useContext, useEffect } from 'react';

import { Select } from '@components/common/Select/Select';
import { Errors, Path, Project } from '@customTypes/configPage';
import { copies } from '@constants/copies';
import { FormControl } from '@contentful/f36-components';
import { errorsActions, parametersActions, singleSelectionSections } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { useError } from '@hooks/useError/useError';

type CopySection = Extract<
  keyof typeof copies.configPage,
  'projectSelectionSection' | 'pathSelectionSection'
>;

interface Props {
  selectedOption: string;
  options: Path[] | Project[];
  parameterAction: parametersActions.APPLY_API_PATH | parametersActions.APPLY_SELECTED_PROJECT;
  section: CopySection;
  id: string;
  handleInvalidSelectionError: () => void;
  helpText?: string | React.ReactNode;
  error?: Errors['projectSelection'] | Errors['apiPathSelection'];
}

export const SelectSection = ({
  selectedOption,
  options,
  parameterAction,
  section,
  id,
  helpText,
  error,
  handleInvalidSelectionError,
}: Props) => {
  const { placeholder, label, emptyMessage, helpText: helpTextCopy } = copies.configPage[section];
  const { isLoading, dispatchParameters, handleAppConfigurationChange, dispatchErrors } =
    useContext(ConfigPageContext);
  const { isError, message } = useError({ error });

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (section === singleSelectionSections.PROJECT_SELECTION_SECTION) {
      // indicate app config change when project has been re-selected
      handleAppConfigurationChange();
      // reset the selected api path only when the project changes
      dispatchParameters({
        type: parametersActions.APPLY_API_PATH,
        payload: '',
      });

      dispatchErrors({
        type: errorsActions.RESET_PROJECT_SELECTION_ERRORS,
      });
    } else if (section === singleSelectionSections.API_PATH_SELECTION_SECTION) {
      dispatchErrors({
        type: errorsActions.RESET_API_PATH_SELECTION_ERRORS,
      });
    }

    dispatchParameters({
      type: parameterAction,
      payload: event.target.value,
    });
  };

  useEffect(() => {
    if (!isLoading) {
      const isValidSelection =
        options.some((item) => item.id === selectedOption) || !selectedOption;
      const areOptionsAvailable = options.length === 0;

      if (!isValidSelection && !areOptionsAvailable) {
        handleInvalidSelectionError();
      }
    }
  }, [selectedOption, options, isLoading]);

  return (
    <FormControl marginBottom="spacingS" id={id} isRequired={true}>
      <Select
        value={isError ? '' : selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        options={options}
        label={label}
        helpText={helpText || helpTextCopy}
        errorMessage={message}
        isLoading={isLoading}
      />
    </FormControl>
  );
};
