const headerSection = {
  title: 'Set up Microsoft Teams',
  description: 'Get notifications about content updates in Contentful directly in Microsoft Teams.',
};

const accessSection = {
  title: 'Access',
  fieldName: 'Tenant Id',
};

const notificationsSection = {
  title: 'Notifications',
  createButton: 'Create notification',
};

const contentTypeSection = {
  title: 'Content type',
  addButton: 'Add content type',
  modalButton: 'Next',
};

const channelSection = {
  title: 'Channel',
  addButton: 'Add channel',
  modalTitle: 'Add Teams channel',
  modalDescription: 'The Contentful app has been added to these channels',
  modalButton: 'Next',
};

enum AppEventKey {
  PUBLISH = 'publish',
  UNPUBLISHED = 'unpublish',
  CREATED = 'create',
  DELETED = 'delete',
}

const AppEvents = {
  [AppEventKey.PUBLISH]: {
    id: AppEventKey.PUBLISH,
    text: 'Publish',
  },
  [AppEventKey.UNPUBLISHED]: {
    id: AppEventKey.UNPUBLISHED,
    text: 'Unpublish',
  },
  [AppEventKey.CREATED]: {
    id: AppEventKey.CREATED,
    text: 'Create',
  },
  [AppEventKey.DELETED]: {
    id: AppEventKey.DELETED,
    text: 'Delete',
  },
};

const actionsSection = {
  title: 'Actions',
  options: AppEvents,
};

const editModeFooter = {
  test: 'Test',
  delete: 'Delete',
  save: 'Save',
};

export {
  headerSection,
  accessSection,
  notificationsSection,
  contentTypeSection,
  channelSection,
  actionsSection,
  editModeFooter,
};
