import React from 'react'
import { useSDK } from '@contentful/react-apps-toolkit'
import { FieldAppSDK } from '@contentful/app-sdk'

import { AppInstanceParameters } from '../../locations/Field'
import ItemCard from './ItemCard'

interface SingleItemProps {
  value: string;
}

const SingleItem = (props:SingleItemProps) => {
  const sdk = useSDK<FieldAppSDK>()
  const { fieldType } = sdk.parameters.instance as unknown as AppInstanceParameters

  const onRemoveItem = () => {
    sdk.field.removeValue();
  }

  return (
    <ItemCard
      id={props.value}
      type={fieldType}
      onRemove={onRemoveItem}
    />
  )
}

export default SingleItem
