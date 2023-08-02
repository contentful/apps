import { AIFeature } from '@configs/features/featureConfig';
import { DialogInvocationParameters } from '@locations/Dialog';

const init: DialogInvocationParameters = {
  feature: AIFeature.TITLE,
  entryId: '',
  fieldLocales: {},
};

export { init };
