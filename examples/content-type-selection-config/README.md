# Assigning an app to ContentTypes

We recommend using `TargetState` to assign apps to specific ContentTypes in your app's
config location. Doing this simplifies the process of installing an app.
The code in `./set-editors.tsx` offers an example of how to use `TargetState` to
enable an app for the EntryEditor location of selected ContentTypes.

![ContentType selection in config location](./config-screenshot.png)

This example can be adapted to suit your app's needs. For example it could be changed
to
* Assign the app to the Sidebar location
* Show only certain ContentTypes depending on some criteria
* Assign an app to certain fields of a ContentType

## More information
Please see [our TargetState documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/target-state/) for more details on how to use it in your app's config.

