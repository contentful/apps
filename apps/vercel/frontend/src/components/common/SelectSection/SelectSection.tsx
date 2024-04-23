import { ChangeEvent, useContext, useEffect, useState } from 'react';

import { Select } from '@components/common/Select/Select';
import { Path, Project } from '@customTypes/configPage';
import { copies } from '@constants/copies';
import { FormControl } from '@contentful/f36-components';
import { actions } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';

type CopySection = Extract<
  keyof typeof copies.configPage,
  'projectSelectionSection' | 'pathSelectionSection'
>;

interface Props {
  selectedOption: string;
  options: Path[] | Project[];
  action: actions.APPLY_API_PATH | actions.APPLY_SELECTED_PROJECT;
  section: CopySection;
  id: string;
}

export const SelectSection = ({ selectedOption, options, action, section, id }: Props) => {
  const [isSelectionInvalid, setIsSelectionInvalid] = useState<boolean>(false);
  const { placeholder, label, emptyMessage, helpText, errorMessage } = copies.configPage[section];
  const { isLoading, dispatch } = useContext(ConfigPageContext);
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: action,
      payload: event.target.value,
    });
  };

  useEffect(() => {
    if (!isLoading) {
      const isValidSelection =
        options.some((item) => item.id === selectedOption) || !selectedOption;
      const areOptionsAvailable = options.length === 0;
      setIsSelectionInvalid(!isValidSelection && !areOptionsAvailable);
    }
  }, [selectedOption, options, isLoading]);

  return (
    <FormControl marginBottom="spacingS" id={id} isRequired={true}>
      <Select
        value={isSelectionInvalid ? '' : selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        options={options}
        label={label}
        helpText={helpText}
        errorMessage={isSelectionInvalid && !isLoading ? errorMessage : undefined}
        isLoading={isLoading}
      />
    </FormControl>
  );
};
