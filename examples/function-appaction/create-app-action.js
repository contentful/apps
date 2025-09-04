const { createClient } = require('contentful-management');
const { parseArgs } = require('node:util');

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      accessToken: {
        type: 'string',
      },
      organizationId: {
        type: 'string',
        short: 'o',
      },
      appDefinitionId: {
        type: 'string',
        short: 'd',
      },
    },
  });
  const accessToken = process.env['CONTENTFUL_ACCESS_TOKEN'] || args.accessToken;
  const organizationId = process.env['CONTENTFUL_ORG_ID'] || args.organizationId;
  const appDefinitionId = process.env['CONTENTFUL_APP_DEF_ID'] || args.appDefinitionId;

  if (!accessToken) {
    console.error('No accessToken provided');
    process.exit(1);
  }

  if (!organizationId) {
    console.error('No organizationId provided');
    process.exit(1);
  }

  if (!appDefinitionId) {
    console.error('No appDefinitionId provided');
    process.exit(1);
  }

  const client = createClient(
    {
      accessToken,
    },
    { type: 'plain' }
  );

  try {
    const appActionResult = await client.appAction.create(
      {
        organizationId,
        appDefinitionId,
      },
      {
        name: 'Example app action',
        parameters: [{ id: 'foo', name: 'Foo', type: 'Symbol' }],
        type: 'function-invocation',
        function: {
          sys: {
            type: 'Link',
            linkType: 'Function',
            id: 'example',
          },
        },
        category: 'Custom',
      }
    );

    if (!appActionResult) {
      throw new Error('Error creating app action');
    }

    return appActionResult;
  } catch (error) {
    console.error('Error creating app action', error);
  }
};
main().then((result) => {
  if (result) {
    console.log(`Created app action: ${result.sys.id}`);
  } else {
    console.error('Failed to create app action');
    process.exit(1);
  }
});
