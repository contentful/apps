This app showcases how to integrate external resource links through the Contentful Graph API, powered by the [MockShop API](https://mock.shop/).

This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

# Table of Contents
1. [Prerequisites](#prerequisites)
2. [Description](#description)
3. [Instructions to create and run the app](#instructions-to-create-and-run-the-app)
    - [Copying the example](#copying-the-example)
    - [Creating a custom app definition](#creating-a-custom-app-definition)
    - [Building and uploading the app](#building-and-uploading-the-app)
    - [Creating resource entities](#creating-resource-entities)
    - [Installing the app](#installing-the-app)
4. [Code structure](#code-structure)
    - [Functions](#functions)
    - [Entities overview](#entities-overview)
    - [Property mapping](#property-mapping)
    - [App manifest](#app-manifest)
5. [Available Scripts](#available-scripts)
# Prerequisites
* We're assuming you are familiar with the following concepts:
  + [App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/), including [App Definition](https://www.contentful.com/developers/docs/extensibility/app-framework/app-definition/) and [App Installation](https://www.contentful.com/developers/docs/extensibility/app-framework/app-installation/)
  + [Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
* The space where you will install the application has the [Orchestration](https://www.contentful.com/help/orchestration/) feature enabled.

* Your system has installed:
  + The latest LTS version of [Node.js](https://nodejs.org/en/)

> **NOTE:** 
> Please make sure you consistently choose the same **Organization ID** that has the Native external references functionality during any setup steps that require you to select the organization.

# Description

Contentful supports external content integration through the [App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/). The [App Marketplace](https://www.contentful.com/marketplace/) currently offers offers ready-made solutions for systems like [Shopify](https://www.contentful.com/help/external-references-with-shopify/) or [commercetools](https://www.contentful.com/help/external-references-with-commercetools/). However, connecting to other systems requires developing custom frontend apps with bespoke implementation.

To overcome these challenges, we offer a more streamlined and cohesive approach to linking third-party systems through existing content model Reference Fields. This upgraded version of fields is referred to as **Native external references** .

Native external references streamline how third-party systems link to existing Reference Fields.

For the purpose of this example, we will be connecting to the [MockShop](https://mock.shop/) external system and query the data using Contentful Graph API

With Native external references we introduce the following new entity types that allow us to model the data from third-party systems in Contentful:

* `Resource Provider` - a third-party system that provides resources. Each provider can have multiple resource types. In our example: a `MockShop` provider.
* `Resource Type` - a specific type of resource (not the resource itself) that is provided by a resource provider. In our example: `Product`.
# Instructions to create and run the app

## Copying the example

To get started with your application, you need to make a local copy of the example code by running the following command in your terminal. 

> **NOTE:** 
> Make sure you replace `<name-of-your-app>` with the name of your choice.

```bash
npx create-contentful-app@latest <name-of-your-app> --example native-external-references-mockshop
```

Once the process finishes, navigate to the directory that was created by running this command:

```bash
cd <name-of-your-app>
```

To complete the process, it is necessary to install all dependencies of the project by executing the following command:

```bash
npm i
```

## Building and uploading the app

After creating the app definition, we can take care of uploading the code by running these commands:

```bash
npm run build && npx contentful-app-scripts upload --ci --bundle-dir ./build --organization-id <organisation-id> --definition-id <app-definition-id> --token <cma-token>`
```

For more information on environment variables, see [npm run upload-ci](#npm-run-upload-ci)

The interactive CLI will prompt you to provide additional details, such as a CMA endpoint URL. Select **Yes** when prompted if you’d like to activate the bundle after upload.

## Creating a custom app definition

To see your app within Contentful, you must first set it up. To do that, we will create an app definition, which is an entity that represents an app in Contentful and stores general information about it.

To create the app definition, run this command:

```bash
npm run create-app-definition
```

You will need to answer the following questions on the terminal. Feel free to proceed with the default options provided.

1. **Name of your application** . This is how your app will be named and it will be displayed in a few places throughout the UI. The default is the name of the folder you created.
2. **Select where your app can be rendered**. This shows potential [app locations](https://www.contentful.com/developers/docs/extensibility/app-framework/locations/) where an app can be rendered within the Contentful Web app. Select **App configuration screen** , as we will utilize the configuration screen to provide the External API URL for the app.
3. **Contentful CMA endpoint URL** . This refers to the URL used to interact with Contentful's Management APIs.
4. **App Parameters** . These are configurable values that can be used to set default values or define custom validation rules. As we need to define these for the API URL in this case:

* Opt for **Y** to advance with the process of defining the parameters.
* Choose **Installation** .
* Input `MockShop API Endpoint` as **Parameter name** and `apiEndpoint` as **ID** .
* Select **Symbol** as type and mark the parameter as required.

5. The next steps will lead you through the process of providing a Contentful access token to the application and specifying the organization to which the application should be assigned.

> **NOTE:** 
> Make sure the organization ID you select here is the Organization that has access to the Native external references feature.
>  
> This command creates the app definition in your first space within the master environment.

You now have a basic application that can be enriched with additional information that will enable the example project you downloaded to function properly.

## Creating resource entities

Executing the provided command in your terminal will generate three extra entities within the app definition, which are described in more detail under the [Entities Overview](#entities-overview) step.

```bash
npm run create-resource-entities
```

This will tell Contentful that we want to connect to `MockShop` via the function we uploaded in [Building and uploading the app](#building-and-uploading-the-app) step and that the same function can provide `MockShop:Product` _Resource Types_.

> **NOTE:** 
> Please configure the .env variables properly before running these scripts
>  
> `create-resource-entities` script generates new entities within the system, and prints out a minimal log when the operation has succeeded.
>  
> If you would like to list all the previously created entities, you can utilize a similar script that prints out more verbose details: `npm run show-resource-entities` .

## Installing the app

* After you successfully upload your app, install it to an existing space by running the command: `npm run install-app`
* Select the space and environment in which you would prefer to install the example app from the dialog that appears. You will have to grant access to the space the app will be installed in.
* After granting access, the configuration screen, which is rendered by the <ConfigScreen /> component, will be displayed. Input your MockShop API URL into the form and proceed to save the changes.

Your example app is now configured and installed.

The form that will save the MockShop API URL when we install the app has been defined in `src/locations/ConfigScreen.tsx` . More information how configuration screens are set up can be found in [this App Configuration tutorial](https://www.contentful.com/developers/docs/extensibility/app-framework/app-configuration/).

# Code structure

## Functions

The example app is using [Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/) to provide a connection between Contentful and the Mock.shop API. In the `functions/mockShop.ts` file we are defining two events that are necessary for Native external references to function properly:

* `resources.search` - retrieval of specific content based on search queries
* `resources.lookup` - retrieval of specific content based on URNs (IDs)
* `graphql.resourcetype.mapping` - retrieves resource type mappings that determine which fields map to an external type
* `graphql.query` -  handles GraphQL queries for the external third-party API.

## Entities overview

Below is a representation of how a _Resource Provider_ is structured, using the MockShop app as an illustrative example.

```json
{
   "sys":{
      "id":"MockShop",
      "type":"ResourceProvider",
      "organization":{
         "sys":{
            "type":"Link",
            "linkType":"Organization",
            "id":"<organisation-id>"
         }
      },
      "appDefinition":{
         "sys":{
            "type":"Link",
            "linkType":"AppDefinition",
            "id":"<app-definitin-id>"
         }
      }
   },
   "type":"function",
   "function":{
      "sys":{
         "type":"Link",
         "linkType":"Function",
         "id":"MockShopTutorial"
      }
   }
}
```

We are representing _Resource Types_ in a similar structure:

```json
{
   "sys":{
      "type":"Array"
   },
   "items":[
      {
         "sys":{
            "id":"MockShop:Product",
            "resourceProvider":{
               "sys":{
                  "type":"Link",
                  "linkType":"ResourceProvider",
                  "id":"MockShop"
               }
            },
            "appDefinition":{
               "sys":{
                  "type":"Link",
                  "linkType":"AppDefinition",
                  "id":"<app-definitin-id>"
               }
            },
            "organization":{
               "sys":{
                  "type":"Link",
                  "linkType":"Organization",
                  "id":"<organisation-id>"
               }
            },
            "type":"ResourceType"
         },
         "name":"Product",
         "defaultFieldMapping":{
            "title":"{ /title }",
            "image":{
               "altText":"{ /featuredImage/altText }",
               "url":"{ /featuredImage/url }"
            },
            "subtitle":"Product ID: { /id }"
         }
      }
   ],
   "pages":{}
}
```

## Property mapping

Contentful uses `resource type mappings` to determine which field in an entry is mapped to an external type and to specify any arguments required for External GraphQL queries defined in `queryHandler` 

Contentful web app displays entries using components that require specific data structures to fill their UI elements.
The mapping between these components and external system data is established using [JSON pointers](https://datatracker.ietf.org/doc/html/rfc6901).

This mapping is defined in the `defaultFieldMapping` property of each `Resource Type` and must adhere to the structure used for mapping the values shown in the entry component:

The definitions of `Product` **Resource Type** representations can be found in the ` src/tools/entities/product.json ` .

## App manifest

The app manifest is a JSON file that describes the app and its capabilities. It contains a `functions` property which is an array of functions the app can run. Currently, Contentful Apps can only be associated with one function, therefore you can only have one function in the array.

The function properties are as follows:

* `id`: The _id_ of the Function.
* `name`: A readable name for the Function.
* `description`: A brief description of the Function.
* `path`: This is the path to the transpiled source file of the Function in your bundle. Exposing a `handler` function.
* `entryFile`: Path pointing to the source file of the Function. Exposing a `handler` function.
* `allowedNetworks`: A list of endpoints the Function should be allowed to connect to. This is a security feature to prevent unauthorized access to your network.
* `accepts`: An array of event types the Function can handle. In this case we have two event types: `resources.search`,  `resources.lookup` `graphql.resourcetype.mapping`,                         `graphql.query`.
# Available Scripts

In the project directory, you can run:

#### `npm start` 

Creates or updates your app definition in Contentful, and runs the app in development mode.
Open your app to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `npm run build` 

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

#### `npm run upload` 

Uploads the build folder to contentful and creates a bundle that is automatically activated.
The command guides you through the deployment process and asks for all required arguments.
Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `npm run upload-ci` 

Similar to `npm run upload` it will upload your app to contentful and activate it. The only difference is  
that with this command all required arguments are read from the environment variables, for example when you add
the upload command to your CI pipeline.

For this command to work, the following environment variables must be set:

* `CONTENTFUL_ORG_ID` - The ID of your organization
* `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
* `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)

#### `npm run open-settings` 

Opens the settings in the Contentful web app so that you can use the UI to change the settings of an [App Definition](https://www.contentful.com/developers/docs/extensibility/app-framework/app-definition/).

#### `npm run install-app` 

Opens a dialog to select the space and environment where the app associated with the given [App Definition](https://www.contentful.com/developers/docs/extensibility/app-framework/app-definition/) should be installed.

#### `npm run create-app-definition` 

An interactive CLI that will prompt you to provide necessary details to create an [App Definition](https://www.contentful.com/developers/docs/extensibility/app-framework/app-definition/).

#### `npm run create-resource-entities` 

A script that reads the `entities` folder and creates new entities within the system. It will print out a minimal log when the operation has succeeded.

#### `npm run show-resource-entities` 

A script that lists all the previously created entities. It will print out more verbose details about the entities.
