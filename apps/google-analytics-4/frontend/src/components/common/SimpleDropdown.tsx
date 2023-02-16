import React from 'react'
import { FormControl, Select } from '@contentful/f36-components'

interface Props {
  children: any;
  selectId: string;
  isRequired?: boolean,
  isDisabled?: boolean
  onSelectionChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export default function SimpleDropdown(props: Props) {
  const { selectId, children, onSelectionChange, isRequired, isDisabled } = props

  return (
    <Select id={selectId} defaultValue="" isDisabled={isDisabled} onChange={onSelectionChange}>
      <Select.Option value="" isDisabled />
      {children}
    </Select>
  )
}
