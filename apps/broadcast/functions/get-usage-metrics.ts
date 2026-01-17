import type {
  AppActionRequest,
  AppActionResponse,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

const ELEVEN_LABS_SUBSCRIPTION_URL = 'https://api.elevenlabs.io/v1/user/subscription';

type GetUsageMetricsResult =
  | {
      status: 'error';
      code: 'PROVIDER_ERROR';
    }
  | {
      status: string;
      character_count: number;
      character_limit: number;
      tier: string;
      next_character_count_reset_unix: number;
    };

type AppInstallationParameters = {
  elevenLabsApiKey?: string;
};

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppInstallationParameters
> = async (
  event: AppActionRequest<'Custom', Record<string, never>>,
  context: FunctionEventContext<AppInstallationParameters>
): Promise<AppActionResponse> => {
  const elevenLabsApiKey = context.appInstallationParameters?.elevenLabsApiKey;

  if (!elevenLabsApiKey) {
    console.warn('get-usage-metrics:missing-api-key');
    return {
      ok: true,
      data: {
        status: 'error',
        code: 'PROVIDER_ERROR',
      } satisfies GetUsageMetricsResult,
    };
  }

  try {
    const response = await fetch(ELEVEN_LABS_SUBSCRIPTION_URL, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 429) {
        console.warn('get-usage-metrics:provider-error', {
          status: response.status,
        });
        return {
          ok: true,
          data: {
            status: 'error',
            code: 'PROVIDER_ERROR',
          } satisfies GetUsageMetricsResult,
        };
      }

      return {
        ok: false,
        errors: [
          {
            message: `ElevenLabs request failed with status ${response.status}.`,
            type: 'ProviderError',
          },
        ],
      };
    }

    const data = (await response.json()) as {
      character_count: number;
      character_limit: number;
      tier: string;
      status: string;
      next_character_count_reset_unix: number;
    };

    return {
      ok: true,
      data: {
        status: data.status,
        character_count: data.character_count,
        character_limit: data.character_limit,
        tier: data.tier,
        next_character_count_reset_unix: data.next_character_count_reset_unix,
      } satisfies GetUsageMetricsResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch usage metrics.';
    console.error('get-usage-metrics:error', { message });
    return {
      ok: false,
      errors: [
        {
          message,
          type: 'ProviderError',
        },
      ],
    };
  }
};
