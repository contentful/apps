import { KeyValueMap } from 'contentful-management';
import { isEmpty } from 'lodash';

// criteria for overall config validity:
// at least one content type is selected and configured with a slug field.
// this means app is in a usable state

export const checkContentTypeConfigValidity = (parameters: KeyValueMap) => {
  if (!parameters.contentTypes || !isEmpty(parameters.contentTypes)) return false;

  const aConfiguredContentType = Object.keys(parameters.contentTypes).find((key) => key);
  const atLeastOneSlugFieldPresent =
    aConfiguredContentType && parameters.contentTypes[aConfiguredContentType].slugField;
  const contentTypesAreConfigured = parameters.contentTypes && atLeastOneSlugFieldPresent;

  return contentTypesAreConfigured;
};
