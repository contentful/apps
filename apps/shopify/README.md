# Persisted Object IDs

The app persists base64 encoded object IDs. These can be decoded by the users e.g. by using [`atob(...)`](https://developer.mozilla.org/en-US/docs/Web/API/atob). A decoded object ID looks the following: `gid://shopify/Product/1`.

Before Shopify API version 2022-04, the Shopify API returned and accepted encoded object IDs. To ensure backwards compatibility, the app keeps storing object IDs in base64 encoded format even though the Shopify API doesn't accept these IDs anymore (see [here](https://shopify.dev/api/release-notes/2022-04#breaking-changes)).

# How to get your storefront access token
1. In your `~/Developer` directory run `npm init @shopify/app@latest`
1. Name your app whatever you'd like, this will be the app's directory name
1. Select `node`
1. `CD` into the app's directory
1. run `npm run dev`
1. Set up your configuration (org, app)
1. Give it your ngrok token from [ngrok](https://dashboard.ngrok.com/get-started/your-authtoken)
1. Once your server is running press `p`
1. Install your app
1. 