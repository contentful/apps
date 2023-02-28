import React from 'react'
import { FormControl, Select } from '@contentful/f36-components'

interface Props {
  children: any;
  selectId: string;
  isRequired?: boolean,
  formTitle: string;
  isDisabled?: boolean
  onSelectionChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export default function SimpleDropdown(props: Props) {
  const { selectId, children, onSelectionChange, isRequired, formTitle, isDisabled } = props

  return (
    <FormControl isRequired={isRequired ?? false}>
      <FormControl.Label>{formTitle}</FormControl.Label>
      <Select id={selectId} defaultValue="" isDisabled={isDisabled} onChange={onSelectionChange}>
        <Select.Option value="" isDisabled />
        {children}
      </Select>
    </FormControl>
  )
}
