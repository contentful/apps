import type {
  AppActionRequest,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

/**
 * Validates a HubSpot access token and checks if it has the 'content' scope.
 * @param token The HubSpot access token to validate.
 * @returns An object with { valid, hasContentScope }
 */

type AppActionParameters = {
  token: string;
};

const ENDPOINT_WITHOUT_SCOPE_CHECK = 'https://api.hubapi.com/integrations/v1/me';
const ENDPOINT_WITH_SCOPE_CHECK =
  'https://api.hubapi.com/cms/v3/source-code/draft/metadata/@hubspot';

const INVALID_ACCESS_TOKEN = 'Invalid HubSpot access token';
const INVALID_ACCESS_TOKEN_SCOPE = 'The HubSpot token is missing the required "content" scope.';
const UNKNOWN_ACCESS_TOKEN_ERROR = 'Unknown error';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>
) => {
  const token = event.body.token;

  // Step 1: Basic token validation
  const basicCheck = await fetch(ENDPOINT_WITHOUT_SCOPE_CHECK, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!basicCheck.ok) {
    return { valid: false, hasContentScope: false, error: INVALID_ACCESS_TOKEN };
  }

  // Step 2: Check for 'content' scope
  const contentCheck = await fetch(ENDPOINT_WITH_SCOPE_CHECK, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (contentCheck.status === 200) {
    return { valid: true, hasContentScope: true, error: null };
  } else {
    const error = await contentCheck.json();

    if (error?.category === 'MISSING_SCOPES') {
      return {
        valid: true,
        hasContentScope: false,
        error: INVALID_ACCESS_TOKEN_SCOPE,
      };
    }

    // Unknown error
    return { valid: true, hasContentScope: true, reason: UNKNOWN_ACCESS_TOKEN_ERROR };
  }
};
