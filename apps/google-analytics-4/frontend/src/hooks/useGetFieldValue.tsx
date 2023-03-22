import { useFieldValue } from '@contentful/react-apps-toolkit';

const useGetFieldValue = (fieldId: string) => {
  let fieldValue = '';

  try {
    const [value] = useFieldValue<string>(fieldId);
    fieldValue = value ?? '';
  } catch (e) {
    console.error(e);
  }

  return fieldValue;
};

export default useGetFieldValue;
