import { UseQueryResult, useQueries, useQuery } from '@tanstack/react-query';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import {
  AppInstanceParameters,
  FieldType,
  ScopeOptions,
  SfccItem,
  scopeOptionsFrom,
} from './resources';
import SfccClient from './Sfcc';

export interface FieldContext {
  fieldType: FieldType;
  options: ScopeOptions;
  locale: string;
  client: SfccClient;
}

/** Field-location context: the configured field type, scope overrides and an API client. */
export function useFieldContext(): FieldContext {
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

const itemQuery = (context: FieldContext, key: string) => ({
  queryKey: ['itemInfo', context.fieldType, context.options.siteId, key],
  queryFn: () => context.client.fetchByKey(context.fieldType, key),
  retry: false,
});

export function useFieldItem(key: string): FieldContext & { query: UseQueryResult<SfccItem> } {
  const context = useFieldContext();
  return { ...context, query: useQuery(itemQuery(context, key)) };
}

export function useFieldItems(
  keys: string[]
): FieldContext & { queries: UseQueryResult<SfccItem>[] } {
  const context = useFieldContext();
  return {
    ...context,
    queries: useQueries({ queries: keys.map((key) => itemQuery(context, key)) }),
  };
}
