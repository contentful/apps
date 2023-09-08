import { ProfileType } from '@locations/ConfigScreen';
import { gptModels, defaultModelId } from '@configs/ai/gptModels';
import { AppInstallationParameters } from '@locations/ConfigScreen';

export const mapV1ParamsToV2 = (params: { [key: string]: string | ProfileType }) => {
  const newParameters = { version: 2 } as AppInstallationParameters;

  if (typeof params.key === 'string') newParameters.apiKey = params.key;

  if (typeof params.model === 'string') {
    const isInModelList = gptModels.find((model) => model.id === params.model);
    if (isInModelList) {
      newParameters.model = params.model;
    } else {
      newParameters.model = defaultModelId;
    }
  }

  if (typeof params.profile === 'string') newParameters.profile = { profile: params.profile };

  return newParameters;
};
