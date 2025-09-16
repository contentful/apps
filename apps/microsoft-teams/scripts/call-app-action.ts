import { AppActionProps, PlainClientAPI, createClient } from 'contentful-management';
import { AppActionCallResponse } from 'contentful-management/dist/typings/entities/app-action-call';
import { parseArgs } from 'node:util';
import util from 'util';

class AppActionRunner {
  private readonly client: PlainClientAPI;

  constructor(
    private readonly accessToken: string,
    private readonly appActionId: string,
    private readonly spaceId: string,
    private readonly environmentId: string,
    private readonly params: Record<string, any>
  ) {
    this.client = createClient(
      {
        accessToken: this.accessToken,
      },
      { type: 'plain' }
    );
  }

  async run(): Promise<AppActionCallResponse | undefined> {
    const appAction = await this.getInstalledAction();
    if (!appAction) {
      console.error('No app action found with id');
      return;
    }

    const appActionResult = await this.callAppAction(appAction);
    if (!appActionResult) {
      console.error('No result returned when calling app action');
      return;
    }
    return appActionResult;
  }

  private async callAppAction(
    appAction: AppActionProps
  ): Promise<AppActionCallResponse | undefined> {
    const result = await this.client.appActionCall.createWithResult(
      {
        appActionId: appAction.sys.id,
        environmentId: this.environmentId,
        spaceId: this.spaceId,
        appDefinitionId: appAction.sys.appDefinition.sys.id,
        retries: 15,
      },
      {
        parameters: this.params,
      }
    );
    if (result.status === 'succeeded') {
      return result.result as AppActionCallResponse;
    }

    return undefined;
  }

  private async getInstalledAction(): Promise<AppActionProps | undefined> {
    const installedAppActions = await this.client.appAction.getManyForEnvironment({
      environmentId: this.environmentId,
      spaceId: this.spaceId,
    });

    const appAction = installedAppActions.items.find(
      (appAction) => appAction.sys.id === this.appActionId
    );

    return appAction;
  }
}

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      accessToken: {
        type: 'string',
      },
      appActionId: {
        type: 'string',
        short: 'a',
      },
      spaceId: {
        type: 'string',
        short: 's',
      },
      environmentId: {
        type: 'string',
        short: 'e',
        default: 'master',
      },
      params: {
        type: 'string',
        short: 'p',
        default: '{}',
      },
    },
  });
  const accessToken = process.env['ACCESS_TOKEN'] || args.accessToken;
  const { appActionId, params, spaceId, environmentId } = args;

  if (!accessToken) {
    console.error('No access token found in env!');
    process.exit(1);
  }

  if (!appActionId) {
    console.error('No appActionId provided');
    process.exit(1);
  }

  if (!spaceId) {
    console.error('No spaceId provided');
    process.exit(1);
  }

  if (!environmentId) {
    console.error('No environmentId provided');
    process.exit(1);
  }

  if (!params) {
    console.error('No params provided');
    process.exit(1);
  }

  const callParams = JSON.parse(params);

  const appActionRunner = new AppActionRunner(
    accessToken,
    appActionId,
    spaceId,
    environmentId,
    callParams
  );

  return appActionRunner.run();
};
main().then((result) => {
  if (result) {
    console.log('APP ACTION RESULT');
    console.log(util.inspect(result, { showHidden: false, depth: null, colors: true }));
    console.log('Result: success!');
  } else {
    console.error('Result: fail!');
    process.exit(1);
  }
});
