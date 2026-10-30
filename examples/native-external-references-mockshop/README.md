# Native external references example app

This is an example app that demonstrates how to create a Contentful app that uses native external references to link to a [mockshop](https://mock.shop/) API.

Check out the [tutorial](https://www.contentful.com/developers/docs/extensibility/app-framework/native-external-references-example-tutorial/) to learn more about how to start with this app.

## Mock Shop API compatibility

Mock Shop currently returns an empty `nodes` array for product IDs returned by its search API, while `product(id:)` resolves those same IDs. This example uses aliases to look up multiple products in one request:

```graphql
# Before: selected products cannot be resolved
query lookupProducts($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Product {
      id
      title
    }
  }
}

# After: each product resolves using its existing URN
query lookupProducts($id0: ID!, $id1: ID!) {
  product0: product(id: $id0) {
    id
    title
  }
  product1: product(id: $id1) {
    id
    title
  }
}
```

The [resource search event](https://www.contentful.com/developers/docs/extensibility/app-framework/resource-entities/) can omit its query when the picker first opens. Missing, empty, or whitespace-only queries use `products(first: 3)` to browse the catalog; nonempty queries continue to use `search(query: $query, first: 3, types: PRODUCT)`.

## Verification

Run these commands from this example's directory:

```sh
npm install
npm run test:ci
npx tsc --noEmit
npm run build
```

The regression tests replay the observed Mock Shop responses without making network requests or requiring Contentful credentials.
