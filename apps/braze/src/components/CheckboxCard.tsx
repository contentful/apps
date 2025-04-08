import { Flex, Checkbox, Text, MarginProps } from '@contentful/f36-components';
import { FontWeightTokens } from '@contentful/f36-tokens';
import { checkboxCard } from './CheckboxCard.styles';
import React, { useEffect, useState } from 'react';

interface CheckboxCardProps extends MarginProps {
  id: string;
  title: string;
  selectedFields: Set<string>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
  fontWeight?: FontWeightTokens;
  children?: React.ReactNode;
}
function CheckboxCard(props: CheckboxCardProps) {
  const { id, title, selectedFields, onChange, isDisabled = false, fontWeight, children } = props;
  const [selected, setSelected] = useState(() => selectedFields.has(id));

  useEffect(() => {
    setSelected(selectedFields.has(id));
  }, [selectedFields]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.checked);
    onChange(event);
  };

  return (
    <Flex
      className={checkboxCard}
      justifyContent="space-between"
      alignItems="center"
      margin="spacingXs"
      padding="spacingXs">
      <Checkbox
        id={id}
        isChecked={!isDisabled && selected}
        onChange={handleChange}
        isDisabled={isDisabled}>
        <Text fontWeight={fontWeight}>{title}</Text>
      </Checkbox>
      {children}
    </Flex>
  );
}
export default CheckboxCard;
