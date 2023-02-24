import React from 'react'
import { FormControl, Select } from '@contentful/f36-components'

interface Props {
  children: any;
  selectId: string;
  formTitle: string;
  helpText: string;
  isDisabled?: boolean
  onSelectionChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export default function SimpleDropdown(props: Props) {
  const { selectId, children, onSelectionChange, formTitle, helpText, isDisabled } = props

  return (
    <FormControl isRequired>
      <FormControl.Label>{formTitle}</FormControl.Label>
      <Select id={selectId} defaultValue="" isDisabled={isDisabled} onChange={onSelectionChange}>
        <Select.Option value="" isDisabled> Please select an option... </Select.Option>
        {children}
      </Select>
      <FormControl.HelpText>{helpText}</FormControl.HelpText>
    </FormControl>
  )
}
