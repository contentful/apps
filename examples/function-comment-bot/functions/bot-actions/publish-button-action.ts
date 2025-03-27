import { isManagementContextInvocation, BotAction, BotActionParams } from '../types';
import type { EditorInterfaceProps } from 'contentful-management';
import { BotActionBase, defaultEditorInterfaceSidebar } from './bot-action-base';

const publicationWidget = {
  settings: {},
  widgetId: 'publication-widget',
  widgetNamespace: 'sidebar-builtin',
};

export class PublishButtonAction extends BotActionBase implements BotAction {
  async execute(params: BotActionParams): Promise<void> {
    const { commentBody, context, parentEntityId } = params;
    if (!isManagementContextInvocation(context)) {
      throw new Error('This action requires the Contentful Management API client to be available');
    }
    const { cma } = context;

    const contentType = await this.loadContentType(cma, parentEntityId);
    const contentTypeId = contentType.sys.contentType.sys.id;
    const editorInterface = await this.loadEditorInterface(cma, contentTypeId);

    if (commentBody.includes('/show-publish')) {
      this.showPublish(editorInterface);
    } else if (commentBody.includes('/hide-publish')) {
      this.hidePublish(editorInterface);
    }

    await cma.editorInterface.update({ contentTypeId }, editorInterface);
    console.log(
      `${commentBody.includes('/show-publish') ? 'Showed' : 'Hid'} publish button for content type`,
      contentTypeId
    );
  }

  private showPublish(editorInterface: EditorInterfaceProps) {
    if (!editorInterface.sidebar) {
      editorInterface.sidebar = defaultEditorInterfaceSidebar;
    }
    if (!editorInterface.sidebar.find(({ widgetId }) => widgetId === publicationWidget.widgetId)) {
      editorInterface.sidebar.unshift(publicationWidget);
    }
  }

  private hidePublish(editorInterface: EditorInterfaceProps) {
    if (!editorInterface.sidebar) {
      editorInterface.sidebar = defaultEditorInterfaceSidebar;
    }
    if (editorInterface.sidebar) {
      editorInterface.sidebar = editorInterface.sidebar.filter(
        ({ widgetId }) => widgetId !== publicationWidget.widgetId
      );
    }
  }
}
