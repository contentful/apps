import { ChangeEvent, Dispatch, useEffect, useState } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { Select } from '@components/common/Select/Select';
import { Path, Project } from '@customTypes/configPage';
import { copies } from '@constants/copies';
import { FormControl } from '@contentful/f36-components';
import { actions } from '@constants/enums';

type CopySection = Extract<
  keyof typeof copies.configPage,
  'projectSelectionSection' | 'pathSelectionSection'
>;

interface Props {
  selectedOption: string;
  options: Path[] | Project[];
  dispatch: Dispatch<ParameterAction>;
  action: actions.APPLY_API_PATH | actions.APPLY_SELECTED_PROJECT;
  section: CopySection;
  id: string;
}

export const SelectSection = ({
  selectedOption,
  options,
  dispatch,
  action,
  section,
  id,
}: Props) => {
  const [isSelectionValid, setIsSelectionValid] = useState<boolean>(false);
  const { placeholder, label, emptyMessage, helpText, errorMessage } = copies.configPage[section];
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: action,
      payload: event.target.value,
    });
  };

  useEffect(() => {
    const isValidSelection = options.some((item) => item.id === selectedOption);
    setIsSelectionValid(!isValidSelection);
  }, [selectedOption]);

  return (
    <FormControl marginBottom="spacingS" id={id} isRequired={true}>
      <Select
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        options={options}
        label={label}
        helpText={helpText}
        errorMessage={isSelectionValid ? errorMessage : undefined}
      />
    </FormControl>
  );
};
