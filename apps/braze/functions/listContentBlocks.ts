import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

type AppInstallationParameters = {
  brazeApiKey: string;
  brazeEndpoint: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event,
  context: FunctionEventContext
) => {
  const { brazeApiKey, brazeEndpoint } =
    context.appInstallationParameters as AppInstallationParameters;

  if (!brazeApiKey || !brazeEndpoint) {
    throw new Error('Braze API key or endpoint not configured');
  }

  try {
    const response = await fetch(`${brazeEndpoint}/content_blocks/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching content blocks: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      contentBlocks: data.content_blocks,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
};
