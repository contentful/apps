import { BotActionBase } from './bot-action-base';

const publicationWidget = {
  settings: {},
  widgetId: 'publication-widget',
  widgetNamespace: 'sidebar-builtin',
};

export class PublishButtonAction extends BotActionBase {
  async execute(params) {
    const { commentBody, context, parentEntityId } = params;
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

  showPublish(editorInterface) {
    if (!editorInterface.sidebar) {
      editorInterface.sidebar = [];
    }
    if (!editorInterface.sidebar.find(({ widgetId }) => widgetId === publicationWidget.widgetId)) {
      editorInterface.sidebar.unshift(publicationWidget);
    }
  }

  hidePublish(editorInterface) {
    if (editorInterface.sidebar) {
      editorInterface.sidebar = editorInterface.sidebar.filter(
        ({ widgetId }) => widgetId !== publicationWidget.widgetId
      );
    }
  }
}
