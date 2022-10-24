# Bynder App

This repository contains the source code for the Bynder app that is on the [marketplace](https://www.contentful.com/marketplace/). 

The app uses Bynder's [Universal Compact View](https://developer-docs.bynder.com/ui-components) to allow a user to select assets from the user's Bynder library and store the selected asset's data provided by Bynder in Contentful. 

[Demo](https://bynder.github.io/bynder-compactview/) of the Compact View and it's modes.

## Installing
The following will need to be configured on the app configuration page:
 - Provide Bynder URL of your account
 - Select the types assets can be selected
 - Select the Compact View Mode user will use to select their assets. See the [documentation](https://developer-docs.bynder.com/ui-components) for more info on what the various modes do. The `SingleSelectFile` modes must be used if the user needs to select a specific derivative. `MultiSelect` allows a user to select multiple images from the dialog at one time, other modes can select multiple assets however the model must be open per asset selection.


_Updated: Aug 2022 to support Universal Compact View v3_