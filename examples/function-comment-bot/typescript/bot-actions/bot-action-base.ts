import { PlainClientAPI } from 'contentful-management';

export class BotActionBase {
  async loadContentType(cma: PlainClientAPI, entryId: string) {
    return cma.entry.get({ entryId });
  }

  async loadEditorInterface(cma: PlainClientAPI, contentTypeId: string) {
    return cma.editorInterface.get({ contentTypeId });
  }
}
