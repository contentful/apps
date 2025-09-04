import { Flex } from '@contentful/f36-components';
import { Multiselect, MultiselectOption } from '@contentful/f36-multiselect';
import { css } from 'emotion';
import { CSSProperties, useMemo } from 'react';
import { getAllStatuses, truncate } from '../utils/entryUtils';
import { Status } from '../types';
import tokens from '@contentful/f36-tokens';

const StatusMultiselect = ({
  selectedStatuses,
  setSelectedStatuses,
  style,
  disabled,
}: {
  selectedStatuses: Status[];
  setSelectedStatuses: (newStatuses: Status[]) => void;
  style?: CSSProperties;
  disabled?: boolean;
}) => {
  const options = getAllStatuses();

  const getPlaceholderText = () => {
    if (selectedStatuses.length === 0) return 'No statuses selected';
    if (selectedStatuses.length === options.length) return 'Filter by status';
    if (selectedStatuses.length === 1) return selectedStatuses[0].label;
    return `${selectedStatuses[0].label} and ${selectedStatuses.length - 1} more`;
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedStatuses(options);
    } else {
      setSelectedStatuses([]);
    }
  };

  const areAllSelected = useMemo(() => {
    return options.every((option) =>
      selectedStatuses.some((status) => status.label === option.label)
    );
  }, [selectedStatuses]);

  return (
    <Flex gap="spacing2Xs" flexDirection="column" style={style}>
      <Multiselect
        placeholder={getPlaceholderText()}
        triggerButtonProps={{ size: 'small' }}
        popoverProps={{ isFullWidth: true }}>
        <Multiselect.SelectAll
          isDisabled={disabled}
          onSelectItem={toggleAll}
          isChecked={areAllSelected}
        />
        {options.map((option) => (
          <MultiselectOption
            isDisabled={disabled}
            className={css`
              font-size: ${tokens.fontSizeS};
            `}
            key={option.label}
            label={truncate(option.label, 20)}
            value={option.label}
            itemId={option.label}
            isChecked={selectedStatuses.some((status) => status.label === option.label)}
            onSelectItem={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedStatuses([...selectedStatuses, option]);
              } else {
                setSelectedStatuses(
                  selectedStatuses.filter((status) => status.label !== option.label)
                );
              }
            }}
          />
        ))}
      </Multiselect>
    </Flex>
  );
};

export default StatusMultiselect;
