import { useContext, useMemo } from 'react';

import { copies } from '@constants/copies';
import { FormControl, TextInput } from '@contentful/f36-components';
import { parametersActions, singleSelectionSections } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { SelectionWrapper } from '@components/common/SelectionWrapper/SelectionWrapper';
import { debounce } from 'lodash';

interface Props {
  value: string;
}

export const TextFieldSection = ({ value }: Props) => {
  const { textInputPlaceholder, label, textInputHelpText } = copies.configPage.pathSelectionSection;
  const { isLoading, dispatchParameters } = useContext(ConfigPageContext);
  const handleApiPathInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatchParameters({
      type: parametersActions.APPLY_API_PATH,
      payload: event.target.value,
    });
  };

  const debouncedHandleApiPathInputChange = useMemo(() => debounce(handleApiPathInput, 700), []);

  return (
    <FormControl
      marginBottom="spacingS"
      id={singleSelectionSections.API_PATH_SELECTION_SECTION}
      isRequired={true}>
      <SelectionWrapper
        label={label}
        isLoading={isLoading}
        isRequired={true}
        helpText={textInputHelpText}>
        <TextInput
          defaultValue={value}
          onChange={debouncedHandleApiPathInputChange}
          placeholder={textInputPlaceholder}
        />
      </SelectionWrapper>
    </FormControl>
  );
};
