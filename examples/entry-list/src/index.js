import { init, locations } from '@contentful/app-sdk';
import { onEntryListUpdated } from './locations/EntryList'

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_ENTRY_LIST)) {
    sdk.entryList.onEntryListUpdated((props) => onEntryListUpdated({entries: props.entries}))
  }
});
