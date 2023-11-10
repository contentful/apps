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

const contentTypeSelection = {
  title: 'Content type',
  addButton: 'Add content type',
  modalButton: 'Next',
};

const channelSelection = {
  title: 'Channel',
  addButton: 'Add channel',
  modal: {
    title: 'Add Teams channel',
    description:
      'Teams channels where the Contentful app has been installed can display notifications.',
    link: 'Add channel',
    button: 'Next',
  },
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
  contentTypeSelection,
  channelSelection,
  actionsSection,
  editModeFooter,
};
