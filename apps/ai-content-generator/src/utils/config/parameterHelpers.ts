import { AppInstallationParametersV1, AppInstallationParametersV2 } from '@locations/ConfigScreen';
import { gptModels, defaultModelId } from '@configs/ai/gptModels';

export const mapV1ParamsToV2 = (params: AppInstallationParametersV1) => {
  const newParameters: AppInstallationParametersV2 = {
    apiKey: '',
    model: defaultModelId,
    profile: { profile: 'default' },
    version: 2,
  };

  if (typeof params.key === typeof String()) {
    newParameters.apiKey = params.key;
  }

  if (typeof params.model === typeof String()) {
    const isInModelList = gptModels.find((model) => model.id === params.model);
    if (isInModelList) {
      newParameters.model = params.model;
    }
  }

  if (typeof params.profile === typeof String()) {
    newParameters.profile = { profile: params.profile };
  }

  return newParameters;
};
