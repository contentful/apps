import { createClient } from 'contentful-management';

import { init, locations, EntryListExtensionSDK } from '@contentful/app-sdk';
import type { KnownSDK } from '@contentful/app-sdk';

import { onEntryListUpdated } from './locations/EntryList';

init((sdk: KnownSDK) => {
  // Creating a CMA client allows you to use the contentful-management library
  // within your app. See the contentful-management documentation at https://contentful.github.io/contentful-management.js/contentful-management/latest/
  // to learn what is possible.
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    },
  );

  if (sdk.location.is(locations.LOCATION_ENTRY_LIST)) {
    const entryListSdk = sdk as EntryListExtensionSDK;
    entryListSdk.entryList.onEntryListUpdated((props) =>
      onEntryListUpdated({ entries: props.entries, sdk: entryListSdk, cma }),
    );
  }
});