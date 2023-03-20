import { useFieldValue } from '@contentful/react-apps-toolkit';

const useGetFieldValue = (fieldId: string) => {
  let fieldValue = '';

  try {
    const [value] = useFieldValue<string>(fieldId);
    fieldValue = value ?? '';
  } catch (e) {
    // TODO: address handling this error in INTEG-219
    console.error(e);
  }

  return fieldValue;
};

export default useGetFieldValue;
