# Commercetools app without search

Sample app for how you can customize one of our marketplace apps for your specific use case. In this example, the API endpoints used by the commercetools app are changed. Our marketplace app uses the [Product Projection Search API](https://docs.commercetools.com/api/projects/products-search). In case you don't have indexing activated on your commercetools project, this app uses the [Product Projection API](https://docs.commercetools.com/api/projects/productProjections) instead.

NOTE: This app is not listed on our marketplace as it does not support full-text search.

## Installation and Usage

Create a custom app in Contentful. Select `Hosted by Contentful` for the frontend. Select the following locations:

- App configuration screen
- Entry field (Short text and Short text, list)

run `npm i` and `npm build`. Drag the contents of the build directory into your app definition.
