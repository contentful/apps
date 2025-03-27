import { Flex, Checkbox, Text, MarginProps } from '@contentful/f36-components';
import { FontWeightTokens } from '@contentful/f36-tokens';
import { checkboxCard } from './CheckboxCard.styles';
import React from 'react';

interface CheckboxCardProps extends MarginProps {
  id: string;
  isSelected: boolean;
  title: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fontWeight?: FontWeightTokens;
  children?: React.ReactNode;
}
function CheckboxCard(props: CheckboxCardProps) {
  const { id, isSelected, title, onChange, fontWeight, children, ...otherProps } = props;

  return (
    <Flex
      style={checkboxCard}
      justifyContent="space-between"
      alignItems="center"
      margin="spacingXs"
      padding="spacingXs"
      {...otherProps}>
      <Checkbox id={props.id} isChecked={props.isSelected} onChange={props.onChange}>
        <Text fontWeight={props.fontWeight}>{props.title}</Text>
      </Checkbox>
      {props.children}
    </Flex>
  );
}
export default CheckboxCard;
