# Contentful Knowledge Base App

> A Contentful Marketplace app to create new knowledge base websites within a few minutes.

## Features

- Content type creation
- Sample content creation
- Content preview
- Netlify build triggers
- Website template deploy

## Easiest way to get started

1. Create an account on [contentful.com](https://www.contentful.com/get-started/)
1. Install the [Knowledge Base App](https://www.contentful.com/marketplace/) from Contentful Marketplace
1. Done!

## Making changes locally

1. [Create a new OAuth application](https://app.netlify.com/user/applications#oauth-applications) on your Netlify account
1. The `.env.example` file contains the environment variables the project needs
1. Create the `.env.development` and `.env.production` files, one for each environment respectively, and fill up the environment variables
1. Note: The env variable `NETLIFY_OAUTH_APP_REDIRECT_URI` must end with `/auth`
1. [Add the `Knowledge Base` app to a Contentful organization](#installing-the-app)
1. Install the dependencies by running `npm ci`
1. `npm start`

## Installing the app

```curl
curl -X POST \
  -H'Content-Type: application/json' \
  -H'Authorization: Bearer <MANAGEMENT_TOKEN_API>' \
  -d'{"name": "Knowledge Base", "src": "http://localhost:1234/index.html", "locations": [{"location": "app-config"}, {"location": "entry-sidebar"}]}' \
  https://api.contentful.com/organizations/<ORGANIZATION_ID>/app_definitions
```

## Testing

It uses `jest` along with `react-testing-library`

```
npm test
```

## Stack

- TypeScript
- React
- [Contentful App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/)

## Troubleshooting

### Environment variables not working?

Try to delete the `.cache` folder whenever changing/updating environment variables.

```
rm -rf ./.cache
```

### How to update `space-template.json`?

We use the `space-template.json` to save all the content types, entries, assets and locales needed the app installation.

The space information we use as template is stored on the `export-config.json` file.

You need to have the `contentful-cli` in order to update the `space-template.json`.

To update it, run:

```
contentful space export --config export-config.json
```

## Support

If you have any problem with this app, please file an issue.

If you have other problems with Contentful not related to this project, you can contact [Customer Support](https://support.contentful.com).

## Screenshots

![Welcome Screen](https://user-images.githubusercontent.com/954889/83034978-26a2b980-a039-11ea-8bd7-2cf0315b6e33.png)
![Knowledge Base App](https://user-images.githubusercontent.com/954889/83035055-46d27880-a039-11ea-98fe-90cc5c7669eb.png)

## License

[MIT](LICENSE.md)
