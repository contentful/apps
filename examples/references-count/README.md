# Entry List location example
This example shows how to build an advanced app with an `EntryList` location. It counts a number of references for the entries.

## How to use

Run locally:

```bash
npm install
npm start
```

To test it, you can create an app definition in your Contentful organization settings pointing to `http://localhost:3000` and chosing the `Entry list` location from the proposed locations list.

[Read the docs](https://www.contentful.com/developers/docs/extensibility/app-framework/) for more information.

## Keep in mind:

- If you have a different default locale from the `en-US`, consider changing the `DEFAULT_ENTRY_FIELD_LOCALE` const in the [src/location/EntryList.ts](https://github.com/contentful/apps/blob/feat/add-entry-list-examples/examples/references-count/src/locations/EntryList.ts#L9)