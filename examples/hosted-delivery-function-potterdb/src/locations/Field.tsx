import React from 'react'
import { FieldAppSDK } from '@contentful/app-sdk'
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit'
import { SingleLineEditor } from '@contentful/field-editor-single-line'

const Field = () => {
  const sdk = useSDK<FieldAppSDK>()
  useAutoResizer()

  return (
    <SingleLineEditor field={sdk.field} locales={sdk.locales} isInitiallyDisabled={false} withCharValidation={true} />
  )
}

export default Field
