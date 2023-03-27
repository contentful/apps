# Persisted Object IDs

The app persists base64 encoded object IDs. These can be decoded by the users e.g. by using [`atob(...)`](https://developer.mozilla.org/en-US/docs/Web/API/atob). A decoded object ID looks the following: `gid://shopify/Product/1`.

Before Shopify API version 2022-04, the Shopify API returned and accepted encoded object IDs. To ensure backwards compatibility, the app keeps storing object IDs in base64 encoded format even though the Shopify API doesn't accept these IDs anymore (see [here](https://shopify.dev/api/release-notes/2022-04#breaking-changes)).
