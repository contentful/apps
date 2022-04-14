import 'regenerator-runtime/runtime' // should be always imported at the top

import { createClient } from 'contentful-management';
import { init, locations, EntryListExtensionSDK } from '@contentful/app-sdk';
import type { KnownSDK } from '@contentful/app-sdk';

import { onEntryListUpdated } from './locations/EntryList';

init((sdk: KnownSDK) => {
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