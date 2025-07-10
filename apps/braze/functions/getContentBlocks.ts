import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { AppInstallationParameters, ConnectedField } from '../src/utils';
import { getConfigAndConnectedFields, initContentfulManagementClient } from './common';
import { AppActionParameters } from './createContentBlocks';

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppActionParameters
> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);
  const { brazeApiKey, brazeEndpoint } =
    context.appInstallationParameters as AppInstallationParameters;
  const { entryId } = event.body;

  const { entryConnectedFields } = await getConfigAndConnectedFields(cma, entryId);

  if (entryConnectedFields.length === 0) {
    return {
      contentBlocks: [],
    };
  }

  const contentBlocks = await Promise.all(
    entryConnectedFields.map((field) => getContentBlock(brazeEndpoint, brazeApiKey, field))
  );

  return {
    contentBlocks: contentBlocks.map((block) => ({
      contentBlockId: block.contentBlock.content_block_id,
      contentBlockName: block.contentBlock.name,
      fieldId: block.fieldId,
      locale: block.locale,
    })),
  };
};

async function getContentBlock(brazeEndpoint: string, brazeApiKey: string, field: ConnectedField) {
  const response = await fetch(
    `${brazeEndpoint}/content_blocks/info?content_block_id=${field.contentBlockId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
    }
  );
  return {
    fieldId: field.fieldId,
    locale: field.locale,
    contentBlock: await response.json(),
  };
}
