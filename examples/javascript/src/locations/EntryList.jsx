import { useEffect } from 'react'
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

const EntryList = () => {
  const sdk = useSDK()

  useEffect(() => {
    const onEntryListUpdated = ({entries}) => {
      const values = entries.reduce(
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
