export const copies = {
  configPage: {
    projectSelectionSection: {
      heading: 'Configure a live preview for a project',
      subHeading: 'Select one of your Vercel projects in order to configure live preview.',
      footer: 'Projects are populated based on your Vercel account.',
      link: 'Learn how to construct a preview path and token.',
    },
    // TO DO: Adjust copies based on future designs
    pathSelectionSection: {
      heading: 'Configure API paths',
      subHeading: 'Select the API paths you want to expose to Contentful.',
      footer: 'API paths are populated based on your Vercel account.',
    },
    contentTypePreviewPathSection: {
      infoNote: {
        infoBoxExample: '/blogs/{entry.fields.slug}',
        infoBoxCopyDescription: 'Preview path and token example:',
        infoBoxTextLink: 'View more examples',
      },
      exampleModal: {
        title: 'Preview URLs',
        button: 'Got it',
        exampleOne: {
          description: 'For each content type, create a URL according to this structure:',
          example: 'https://[YOUR_PREVIEW_DOMAIN]/[PLACEHOLDER_TOKEN]',
        },
        exampleTwo: {
          description:
            'The base path of your preview website or app (Example: https://myapp.com/entities)',
          example: '[YOUR_PREVIEW_DOMAIN]',
        },
        exampleThree: {
          description:
            'A token that is resolved into an actual value when a user clicks on the preview link. You can add one or multiple tokens. Premium plan customers can specify',
          example: '[PLACEHOLDER_TOKEN]',
        },
        tableOne: [
          {
            description: 'The environment ID for the entry',
            example: '{env_id}',
          },
          {
            description: 'An object containing all the properties and their values for the entry',
            example: '{entry}',
          },
          {
            description: 'ID of the current entry',
            example: '{entry.sys.id}',
          },
          {
            description:
              'The value of the slug field, based on the localization provided (will not fallback to default locale in case of invalid locale)',
            example: '{entry.fields.slug}',
            exampleTwo: '[LOCALE_CODE]',
          },
          {
            description:
              'The code for your current selected locale. In multi-locale mode it will use the default locale of your space',
            example: '{locale}',
          },
        ],
        tableTwo: [
          {
            description:
              'ID of the entry, which is referencing the current entry (the one you have opened in the editor)',
            example: '{entry.linkedBy.sys.id}',
          },
          {
            description:
              'Value of the slug field for the entry, which references entry from the previous example',
            example: '{entry.linkedBy.fields.slug}',
          },
        ],
        footer: 'For more detail about preview URLs, read the docs.',
      },
    },
  },
};
