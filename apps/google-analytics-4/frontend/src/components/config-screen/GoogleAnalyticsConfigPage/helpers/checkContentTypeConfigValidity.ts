import { KeyValueMap } from 'contentful-management';
import { isEmpty } from 'lodash';

// criteria for checking that content type config is minimally valid so that the app is in a usable state:
// at least one content type is selected and configured with a slug field.

export const checkContentTypeConfigValidity = (parameters: KeyValueMap) => {
  if (!parameters.contentTypes || !isEmpty(parameters.contentTypes)) return false;

  const aConfiguredContentType = Object.keys(parameters.contentTypes).find((key) => key);
  const atLeastOneSlugFieldPresent =
    aConfiguredContentType && parameters.contentTypes[aConfiguredContentType].slugField;
  const contentTypesAreConfigured = parameters.contentTypes && atLeastOneSlugFieldPresent;

  return contentTypesAreConfigured;
};
