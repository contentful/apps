import { OAuthSDK } from './initiateOauth';
import {
  FunctionEventHandler,
  AppActionRequest,
  FunctionTypeEnum,
  AppActionResponse,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';

interface ListGoogleDocsParams {
  pageToken?: string;
  pageSize?: number;
}

interface GoogleDoc {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime: string;
}

interface ListGoogleDocsResponse {
  documents: GoogleDoc[];
  nextPageToken?: string;
}

export async function listGoogleDocs(
  sdk: OAuthSDK,
  params: ListGoogleDocsParams = {}
): Promise<ListGoogleDocsResponse> {
  try {
    const tokenResponse = await sdk.token();
    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('No OAuth token available. Please connect to Google first.');
    }

    const { pageToken, pageSize = 20 } = params;
    const queryParams = new URLSearchParams({
      q: "mimeType='application/vnd.google-apps.document'",
      pageSize: pageSize.toString(),
      fields: 'nextPageToken, files(id, name, webViewLink, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    if (pageToken) {
      queryParams.append('pageToken', pageToken);
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list Google Docs: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const documents: GoogleDoc[] = (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      modifiedTime: file.modifiedTime,
    }));

    return {
      documents,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Failed to list Google Docs:', error);
    throw error;
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', ListGoogleDocsParams>,
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
    const result = await listGoogleDocs(sdk, event.body || {});
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to list Google Docs',
      }),
    };
  }
};
