export const copies = {
  configPage: {
    authenticationSection: {
      heading: 'Connect Vercel',
      subheading: 'Vercel Access Token',
      input: {
        placeholder: 'ex. atE2sdftcIp01O1isdfXc3QTdT4...',
      },
      link: {
        href: 'https://vercel.com/docs/rest-api#creating-an-access-token',
      },
      statusMessages: {
        valid: 'Valid access token',
        invalid: 'Invalid access token',
        notConfigured: 'Token not configured',
      },
    },
    projectSelectionSection: {
      helpText: 'Select one of your Vercel projects.',
      dropdown: {
        label: 'Project',
        placeholder: 'Please select a project...',
        emptyMessage: 'No Projects currently configured.',
      },
    },
    pathSelectionSection: {
      helpText: 'Select one one of your Vercel routes.',
      dropdown: {
        label: 'API Path',
        placeholder: 'Please select a path...',
        emptyMessage: 'No paths currently configured.',
      },
    },
    contentTypePreviewPathSection: {
      infoNote: {
        example: '/blogs/{entry.fields.slug}',
        description: 'Preview path and token example:',
        link: {
          copy: 'View tokens',
        },
      },
      exampleModal: {
        title: 'Preview paths and tokens',
        button: 'Got it',
        exampleOne: {
          description:
            'For each content type, create a preview path and token according to this structure:',
          example: '[preview_domain]/[placeholder_token]',
        },
        exampleTwo: {
          description: 'The base path of your preview website or app (Example: /entities)',
          example: '[preview_domain]',
        },
        exampleThree: {
          description:
            'A token that is resolved into an actual value when a user clicks on the preview link. You can add one or multiple tokens. Premium plan customers can specify',
          example: '[placeholder_token]',
          link: {
            copy: 'custom preview tokens.',
            href: 'https://www.contentful.com/developers/docs/tutorials/general/content-preview/',
          },
        },
        tableOne: {
          headers: ['Placholder token', 'Definition'],
          rows: [
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
                'The value of the slug field for the current entry (default locale unless otherwise specified)',
              example: '{entry.fields.slug}',
            },
            {
              description:
                'The value of the slug field, based on the localization provided (will not fallback to default locale in case of invalid locale)',
              example: '{entry.fields.slug}',
              exampleTwo: '[locale_code]',
            },
            {
              description:
                'The code for your current selected locale. In multi-locale mode it will use the default locale of your space',
              example: '{locale}',
            },
          ],
        },
        tableTwo: {
          headers: ['Linked entries', 'Definition'],
          rows: [
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
        },
        tableTwoSubHeading: {
          link: {
            href: 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters/links-to-entry',
          },
        },
        footer: {
          copy: 'Learn more about setting up content preview.',
          href: 'https://www.contentful.com/developers/docs/tutorials/general/content-preview/',
        },
      },
    },
  },
};
