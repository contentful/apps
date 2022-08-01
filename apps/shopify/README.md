
# Migration of Shopify api version to latest stable version

We have migrated to latest stable i.e. 2022-04.

There are some [breaking changes](https://shopify.dev/api/release-notes/2022-04#breaking-changes) in this new stable version in which the below change was crashing our migration

* Non-encoded object IDs in the GraphQL Storefront API(instead of base 64 encoded IDs API will give decoded IDs in the response)
* (`Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0LzE=` -> `gid://shopify/Product/1`)

  
# Actions taken to make our app stable for future 

* In order to make app stable and support further versions we are currently converting the non-encoded object IDs(`gid://shopify/Product/1`) to Base64 encoded IDs(`Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0LzE`) and storing it in our database.

* Sending decoded version of Base64 hashed ID(`gid://shopify/Product/1`) as arguments to fields and mutations to support coming versions as sending Base64 version will be [deprecated](https://shopify.dev/api/examples/object-ids#migrate-your-app) in coming versions.