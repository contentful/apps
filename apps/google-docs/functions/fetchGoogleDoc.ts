import { OAuthSDK } from './initiateOauth';
import {
  FunctionEventHandler,
  AppActionRequest,
  FunctionTypeEnum,
  AppActionResponse,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';

interface FetchGoogleDocParams {
  documentId: string;
}

export async function fetchGoogleDoc(
  sdk: OAuthSDK,
  params: FetchGoogleDocParams
): Promise<unknown> {
  try {
    const tokenResponse = await sdk.token();
    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('No OAuth token available. Please connect to Google first.');
    }

    const { documentId } = params;
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    // Fetch document using Google Docs API
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}?includeTabsContent=true`,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch Google Doc: ${response.status} ${errorText}`);
    }

    const documentData = await response.json();
    return documentData;
  } catch (error) {
    console.error('Failed to fetch Google Doc:', error);
    throw error;
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', FetchGoogleDocParams>,
  context: FunctionEventContext
): Promise<AppActionResponse> => {
  const sdk = (context as any).oauthSdk;

  if (!sdk) {
    console.error('No SDK available in context');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No SDK available in context' }),
    };
  }

  try {
    const documentData = await fetchGoogleDoc(sdk, event.body || { documentId: '' });
    return {
      statusCode: 200,
      body: JSON.stringify(documentData),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch Google Doc',
      }),
    };
  }
};
