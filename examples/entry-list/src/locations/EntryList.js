export const onEntryListUpdated = ({entries}) => {
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
