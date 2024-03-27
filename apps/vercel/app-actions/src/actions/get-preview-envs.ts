import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, ContentPreviewEnvironment } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {}

export const handler = withAsyncAppActionErrorHandling(
  async (
    _parameters: AppActionCallParameters,
    _context: AppActionCallContext
  ): Promise<AppActionCallResponse<ContentPreviewEnvironment[]>> => {
    const envId = 'vercel-app-preview-environment';
    return {
      ok: true,

      // TODO for now this value is intentionally hard coded
      data: [
        {
          sys: {
            id: envId,
            version: 1,
            type: 'PreviewEnvironment',
          },
          name: 'Vercel App',
          description: 'Content preview environment provided by Vercel app',
          configurations: [
            {
              contentType: 'post',
              enabled: true,
              example: false,
              name: '',
              // hardcoded URL is for intentional testing purposes
              url: 'https://team-integrations-vercel-playground-{env_id}.vercel.app/api/enable-draft?path=/blogs/{entry.fields.slug}&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7',
              contentTypeFields: [],
            },
            {
              contentType: 'food',
              enabled: true,
              example: false,
              name: '',
              // hardcoded URL is for intentional testing purposes
              url: 'https://team-integrations-vercel-playground-{env_id}.vercel.app/api/enable-draft?path=/food/{entry.fields.slug}&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7',
              contentTypeFields: [],
            },
          ],
          envId,
        },
      ],
    };
  }
);
