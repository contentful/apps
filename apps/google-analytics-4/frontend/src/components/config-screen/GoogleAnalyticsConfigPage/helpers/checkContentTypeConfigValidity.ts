import { KeyValueMap } from 'contentful-management';
import { isEmpty } from 'lodash';

// criteria for checking that content type config is minimally valid so that the app is in a usable state:
// at least one content type is selected and configured with a slug field.

export const checkContentTypeConfigValidity = (parameters: KeyValueMap) => {
  if (isEmpty(parameters.contentTypes)) return false;

  const aConfiguredContentType = Object.keys(parameters.contentTypes).find((key) => key);
  const contentTypeAndSlugFieldConfigured =
    aConfiguredContentType && parameters.contentTypes[aConfiguredContentType].slugField;

  return contentTypeAndSlugFieldConfigured;
};
