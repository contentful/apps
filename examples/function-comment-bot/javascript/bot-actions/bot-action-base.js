export class BotActionBase {
  async loadContentType(cma, entryId) {
    return cma.entry.get({ entryId });
  }

  async loadEditorInterface(cma, contentTypeId) {
    return cma.editorInterface.get({ contentTypeId });
  }
}
