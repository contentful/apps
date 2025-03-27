import { PlainClientAPI } from 'contentful-management';

export class BotActionBase {
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
