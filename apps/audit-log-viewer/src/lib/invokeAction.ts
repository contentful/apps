import type { PageAppSDK } from '@contentful/app-sdk';
import type { ListLogFilesResult } from './types';

const ACTION_NAME = 'listAuditLogFiles';

type WireResult = ({ ok: true } & ListLogFilesResult) | { ok: false; error: string };

export async function invokeListAction(
  sdk: PageAppSDK,
  params: { startDate: string; endDate: string }
): Promise<ListLogFilesResult> {
  const { items } = await sdk.cma.appAction.getManyForEnvironment({
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
  });
  const action = items.find(
    (a) => a.name === ACTION_NAME && a.sys.appDefinition?.sys.id === sdk.ids.app
  );
  if (!action) {
    throw new Error(`App action "${ACTION_NAME}" not found — run npm run configure-app`);
  }
  const call = await sdk.cma.appActionCall.createWithResult(
    {
      appDefinitionId: sdk.ids.app!,
      appActionId: action.sys.id,
      retries: 15,
    },
    { parameters: params }
  );
  if (call.sys.status !== 'succeeded') {
    throw new Error(call.sys.error?.message ?? 'App action call failed');
  }
  const result = call.sys.result as WireResult;
  if (!result.ok) throw new Error(result.error);
  return { files: result.files, truncated: result.truncated };
}
