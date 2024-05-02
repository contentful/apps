import { ChangeEvent, useContext, useEffect } from 'react';

import { Select } from '@components/common/Select/Select';
import { Errors, Path, Project } from '@customTypes/configPage';
import { copies } from '@constants/copies';
import { FormControl } from '@contentful/f36-components';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { useError } from '@hooks/useError/useError';

type CopySection = Extract<
  keyof typeof copies.configPage,
  'projectSelectionSection' | 'pathSelectionSection'
>;
interface Props {
  selectedOption: string;
  options: Path[] | Project[];
  section: CopySection;
  id: string;
  handleInvalidSelectionError: () => void;
  handleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  helpText?: string | React.ReactNode;
  error?: Errors['projectSelection'] | Errors['apiPathSelection'];
}

export const SelectSection = ({
  selectedOption,
  options,
  section,
  id,
  helpText,
  error,
  handleInvalidSelectionError,
  handleChange,
}: Props) => {
  const { placeholder, label, emptyMessage, helpText: helpTextCopy } = copies.configPage[section];
  const { isLoading } = useContext(ConfigPageContext);
  const { isError, message } = useError({ error });

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
