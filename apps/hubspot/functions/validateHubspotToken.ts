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

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>
) => {
  const token = event.body.token;

  // Step 1: Basic token validation
  const basicCheck = await fetch('https://api.hubapi.com/integrations/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!basicCheck.ok) {
    return { valid: false, hasContentScope: false };
  }

  // Step 2: Check for 'content' scope
  const contentCheck = await fetch(
    'https://api.hubapi.com/cms/v3/source-code/draft/metadata/@hubspot',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (contentCheck.status === 200) {
    return { valid: true, hasContentScope: true };
  } else {
    const error = await contentCheck.json();

    if (error?.category === 'MISSING_SCOPES') {
      return { valid: true, hasContentScope: false };
    }

    return { valid: true, hasContentScope: false };
  }
};
