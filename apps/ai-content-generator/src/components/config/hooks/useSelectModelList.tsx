import { Select } from '@contentful/f36-components';
import { gptModels } from '@utils/gptModels';

const useSelectModelList = () => {
  const models = gptModels.map((model) => (
    <Select.Option key={model} value={model}>
      {model}
    </Select.Option>
  ));

  return { SelectModelList: models };
};

export default useSelectModelList;
