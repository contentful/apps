import gptModels from '@configs/gptModels';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { generateRandomString } from '@test/mocks';

const generateRandomInstallationParameters = (): AppInstallationParameters => {
  const randomModelIndex = Math.floor(Math.random() * gptModels.length);
  const randomApiKey = generateRandomString(48);
  const randomProfile = generateRandomString(10);

  return {
    model: gptModels[randomModelIndex],
    apiKey: 'sk-' + randomApiKey,
    profile: randomProfile,
  };
};

export { generateRandomInstallationParameters };
