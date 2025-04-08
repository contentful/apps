import { type FunctionEventContext } from '@contentful/node-apps-toolkit';
import { type PlainClientAPI, createClient } from 'contentful-management';

export class BotActionBase {
  initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
    if (!context.cmaClientOptions) {
      throw new Error(
        'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
      );
    }
    return createClient(context.cmaClientOptions, {
      type: 'plain',
      defaults: {
        spaceId: context.spaceId,
        environmentId: context.environmentId,
      },
    });
  }

  async loadContentType(cma: PlainClientAPI, entryId: string) {
    return cma.entry.get({ entryId });
  }

  async loadEditorInterface(cma: PlainClientAPI, contentTypeId: string) {
    return cma.editorInterface.get({ contentTypeId });
  }
}

export const defaultEditorInterfaceSidebar = [
  {
    widgetId: 'publication-widget',
    widgetNamespace: 'sidebar-builtin',
  },
  {
    widgetId: 'content-preview-widget',
    widgetNamespace: 'sidebar-builtin',
  },
  {
    widgetId: 'incoming-links-widget',
    widgetNamespace: 'sidebar-builtin',
  },
  {
    widgetId: 'translation-widget',
    widgetNamespace: 'sidebar-builtin',
  },
  {
    widgetId: 'versions-widget',
    widgetNamespace: 'sidebar-builtin',
  },
];
