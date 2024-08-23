# SAP App Actions

Hosted app actions are used to call the SAP APIs specifically for the private SAP Air app, so that the air header can be added to each network call.

## Install packages

`npm i`

## Actions

### [fetchBaseSites](src/actions/fetchBaseSites.ts)

This action is used to fetch a list of base sites from SAP Commerce Cloud.

### [fetchProductList](src/actions/fetchProductList.ts)

This action is used to fetch a list of products from SAP Commerce Cloud.

### [fetchProductPreview](src/actions/fetchProductPreview.ts)

This action is used to fetch a list of product previews from SAP Commerce Cloud.

## Testing

1. Build the app:

Run `npm run build` from the root directory of the app (or just `npm run build-app-actions` or `npm run build-frontend` if you've only made changes in one of those directories and don't want to rebuild the whole app)

2. Deploy to staging: Run either `npm run deploy:test:sap` or `npm run deploy:test:sap-air` depending on which app you want to use for testing (Note: you will need to pass in DEV_TESTING_ORG_ID and TEST_CMA_TOKEN as environment variables)

3. Call the app action: For example

$ npm run call-app-action -- --appActionId=fetchProductPreviews --params='{ <params list here> }' --spaceId=<space_id> --accessToken=<access_token>
