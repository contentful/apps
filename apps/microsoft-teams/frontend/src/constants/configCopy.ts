const headerSection = {
  title: 'Set up the Microsoft Teams App',
  description: 'Get notifications about Contentful content updates directly in Microsoft Teams.',
};

// TODO: Update to deep link with Teams app id
// https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/deep-link-application?tabs=teamsjs-v2#deep-link-to-open-application-install-dialog
const appDeepLink = 'https://teams.microsoft.com/';

const accessSection = {
  title: 'Access',
  fieldName: 'Tenant Id',
  teamsAppInfo:
    'Install the Contentful app in Microsoft Teams channels where you would like to receive notifications.  View Teams docs',
  teamsAppLink: 'View Teams docs',
};

const notificationsSection = {
  title: 'Notifications',
  createButton: 'Create notification',
  enabledToggle: 'Notifications activated',
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete:
    'If you delete this notification you will no longer get updates about this content type in Microsoft Teams.',
  duplicateModal: {
    modalHeaderTitle: 'Duplicate Notification',
    confirmDuplicate: 'Update existing notification',
    goBack: 'Go back to editing',
    confirmDuplicateDescription:
      'You already have a notification set up for this content type and MS Teams channel. Would you like to update the existing notification instead of creating a new one?',
  },
};

const contentTypeSelection = {
  title: 'Content type',
  addButton: 'Select content type',
  modal: {
    title: 'Select content type',
    button: 'Select',
    link: 'Add content type',
    emptyHeading: 'No content types',
    emptyContent:
      'There are no content types available. If you create one, you will be able to assign it to the app from this screen. Add content type',
  },
  notFound: 'Content type not found',
};

const channelSelection = {
  title: 'Microsoft Teams channel',
  addButton: 'Select channel',
  modal: {
    title: 'Select Microsoft Teams channel',
    description:
      'Microsoft Teams channels where the Contentful app has been installed can display notifications.',
    link: 'Add app',
    button: 'Select',
    emptyHeading: 'Add Microsoft Teams channels',
    emptyContent:
      'In Microsoft Teams, add the Contentful app to the general channel of the teams where you want to see notifications. Add app',
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
  cancel: 'Cancel',
  save: 'Save',
  confirmCancelDescription: 'If you cancel, your changes will not be saved.',
  goBack: 'Go back to editing',
  confirmCancel: 'Confirm cancelation',
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
