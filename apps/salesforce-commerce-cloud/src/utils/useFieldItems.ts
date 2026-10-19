import { useQueries, useQuery } from '@tanstack/react-query';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import { AppInstanceParameters, scopeOptionsFrom } from '../locations/Field';
import SfccClient from './Sfcc';

/** Field-location context: the configured field type, scope overrides and an API client. */
export function useFieldContext() {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();
  const instance = sdk.parameters.instance as AppInstanceParameters;
  const options = scopeOptionsFrom(instance);

  return {
    fieldType: instance.fieldType,
    options,
    locale: sdk.field.locale,
    client: new SfccClient(cma, sdk.ids, options),
  };
}

const itemQuery = (context: ReturnType<typeof useFieldContext>, key: string) => ({
  queryKey: ['itemInfo', context.fieldType, context.options.siteId, key],
  queryFn: () => context.client.fetchByKey(context.fieldType, key),
  retry: false,
});

export function useFieldItem(key: string) {
  const context = useFieldContext();
  return { ...context, query: useQuery(itemQuery(context, key)) };
}

export function useFieldItems(keys: string[]) {
  const context = useFieldContext();
  return {
    ...context,
    queries: useQueries({ queries: keys.map((key) => itemQuery(context, key)) }),
  };
}
