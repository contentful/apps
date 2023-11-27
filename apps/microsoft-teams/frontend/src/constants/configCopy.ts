const headerSection = {
  title: 'Set up Microsoft Teams',
  description: 'Get notifications about content updates in Contentful directly in Microsoft Teams.',
};

// TODO: Update deep link with Teams app id
// https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/deep-link-application?tabs=teamsjs-v2#deep-link-to-open-application-install-dialog
const appDeepLink = 'https://teams.microsoft.com/l/app/';

const accessSection = {
  title: 'Access',
  fieldName: 'Tenant Id',
};

const notificationsSection = {
  title: 'Notifications',
  createButton: 'Create notification',
  enabledToggle: 'Notifications enabled',
  editButton: 'Edit',
};

const contentTypeSelection = {
  title: 'Content type',
  addButton: 'Add content type',
  modal: {
    title: 'Add content type',
    button: 'Next',
  },
  notFound: 'Content type not found',
};

const channelSelection = {
  title: 'Channel',
  addButton: 'Add channel',
  modal: {
    title: 'Add Teams channel',
    description:
      'Teams channels where the Contentful app has been installed can display notifications.',
    link: 'Add app',
    button: 'Next',
    emptyHeading: 'Add Teams channels',
    emptyContent:
      'In Teams, add the Contentful app to channels where you want to see notifications. Add app',
  },
  notFound: 'Channel not found',
};

export enum AppEventKey {
  PUBLISH = 'publish',
  UNPUBLISHED = 'unpublish',
  CREATED = 'create',
  DELETED = 'delete',
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
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
  [AppEventKey.ARCHIVE]: {
    id: AppEventKey.ARCHIVE,
    text: 'Archive',
  },
  [AppEventKey.UNARCHIVE]: {
    id: AppEventKey.UNARCHIVE,
    text: 'Unarchive',
  },
};

const eventsSelection = {
  title: 'Actions',
  options: AppEvents,
};

const editModeFooter = {
  test: 'Test',
  delete: 'Delete',
  confirmDelete:
    'If you delete this notification you will no longer get updates about this content type in Microsoft Teams.',
  cancel: 'Cancel',
  save: 'Save',
};

export {
  headerSection,
  appDeepLink,
  accessSection,
  notificationsSection,
  contentTypeSelection,
  channelSelection,
  eventsSelection,
  editModeFooter,
};
