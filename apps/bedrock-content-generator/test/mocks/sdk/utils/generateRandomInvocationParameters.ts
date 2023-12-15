import { AIFeature } from '@configs/features/featureConfig';
import { DialogInvocationParameters } from '@locations/Dialog';
import { generateRandomString } from '@test/mocks';

const generateRandomInvocationParameters = (): DialogInvocationParameters => {
  const features = Object.values(AIFeature);

  const feature = features[Math.floor(Math.random() * features.length)];
  const entryId = generateRandomString(10);
  const fieldLocales = {};

  return {
    feature,
    entryId,
    fieldLocales,
  };
};

export { generateRandomInvocationParameters };
