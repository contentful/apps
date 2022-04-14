import { useEffect } from 'react'
import { EntryListExtensionSDK, EntryListExtraDataType, OnEntryListUpdatedHandler } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

const EntryList = () => {
  const sdk = useSDK<EntryListExtensionSDK>()

  useEffect(() => {
    const onEntryListUpdated: OnEntryListUpdatedHandler = ({entries}) => {
      const values = entries.reduce<EntryListExtraDataType['values']>(
        (res, item) => {
          res[item.sys.id] = `${item.sys.id}`
          return res
        },
        {}
      )

      return {
        values,
      }
    }

    sdk.entryList.onEntryListUpdated(onEntryListUpdated)
  }, [sdk.entryList])

  return null;
}

export default EntryList
