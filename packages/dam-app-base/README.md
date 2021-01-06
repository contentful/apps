[![CircleCI](https://circleci.com/gh/contentful/apps.svg?style=svg&circle-token=913f0d4852062fbed644fca927d059d5e3e72908)](https://circleci.com/gh/contentful/apps)

# dam-app-base

`@contentful/dam-app-base` is a library that helps you to quickly build an app to integrate your DAM (Digital Asset Management) system of choice with Contentful. Many DAM integrations are very similar, therefore this library provides the boilerplate for your app and you only need to add the code for your specific service.

## Usage

```javascript
import { setup } from '@contentful/dam-app-base';

setup({
  cta: 'Select assets',
  name: 'My DAM App',
  logo: 'https://example.com/logo.svg',
  color: '#d7f0fa',
  description: 'My example DAM App',
  parameterDefinitions: [
    {
      "id": "folder",
      "type": "Symbol",
      "name": "Folder",
      "description": "Preselected folder when selecting assets.",
      "required": true
    }
  ],
  validateParameters: () => null,
  makeThumbnail: asset => asset.thumbnailUrl,
  renderDialog: async (sdk) => {
    const config = sdk.parameters.invocation;

    const container = document.createElement('div');
    container.innerHTML = `<iframe src="https://example.com/dam?folder=${config.folder}" />`;
    document.body.appendChild(container);
  },
  openDialog: async (sdk, currentValue, config) => {
    return await sdk.dialogs.openCurrentApp({
      parameters: { config, currentValue },
    });
  },
  isDisabled: () => false
});
```

[Type Documentation](docs/README.md)

## Apps

These Contentful apps use `@contentful/dam-app-base`. Look at there source code to learn how they utilize this library:

- [Brandfolder](../apps/brandfolder)
- [Bynder](../apps/brandfolder)
- [Cloudinary](../apps/cloudinary)
- [Dropbox](../apps/dropbox)
- [Frontify](../apps/frontify)
- [Mux](../apps/mux)
