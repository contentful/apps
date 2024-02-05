import { AppEventKey } from '@customTypes/configPage';

const headerSection = {
  title: 'Set up the Microsoft Teams App',
  description: 'Get notifications about Contentful content updates directly in Microsoft Teams.',
};

// TODO: Update to deep link with Teams app id
// https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/deep-link-application?tabs=teamsjs-v2#deep-link-to-open-application-install-dialog
const appDeepLink = 'https://teams.microsoft.com/';

const accessSection = {
  title: 'Access',
  description:
    'Authorize Microsoft Teams here. Then, add the Contentful app to your Teams channel.',
  fieldName: 'Tenant Id',
  login: 'Connect to Teams',
  logout: 'Disconnect',
  teamsAppInfo:
    'Install the Contentful app in Microsoft Teams channels where you would like to receive notifications.  View Teams docs',
  teamsAppLink: 'View Teams docs',
  disconnectModal: {
    confirmDisonnect: 'Disconnect',
    goBack: 'Go back',
    description:
      'By disconnecting, you will no longer see configured notifications for this tenant. Are you sure you want to disconnect?',
  },
  updateConfirmation: 'Microsoft organization updated',
  saveWarning: 'Save the app to persist these settings',
};

const notificationsSection = {
  title: 'Notifications',
  createButton: 'Create notification',
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete:
    'If you delete this notification you will no longer get updates about this content type in Microsoft Teams.',
  duplicateModal: {
    modalHeaderTitle: 'Duplicate Notification',
    confirmDuplicate: 'Update existing notification',
    goBack: 'Go back to editing',
    confirmDuplicateDescription:
      'You already have a notification set up for this content type and Teams channel. Would you like to update the existing notification or create a new one?',
  },
  updateConfirmation: 'Notification settings updated',
  saveWarning: 'Save the app to persist these settings',
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
};

const AppEvents = {
  [AppEventKey.ENTRY_PUBLISH]: {
    id: AppEventKey.ENTRY_PUBLISH,
    text: 'Publish',
  },
  [AppEventKey.ENTRY_UNPUBLISHED]: {
    id: AppEventKey.ENTRY_UNPUBLISHED,
    text: 'Unpublish',
  },
  [AppEventKey.ENTRY_CREATED]: {
    id: AppEventKey.ENTRY_CREATED,
    text: 'Create',
  },
  [AppEventKey.ENTRY_DELETED]: {
    id: AppEventKey.ENTRY_DELETED,
    text: 'Delete',
  },
  [AppEventKey.ENTRY_ARCHIVE]: {
    id: AppEventKey.ENTRY_ARCHIVE,
    text: 'Archive',
  },
  [AppEventKey.ENTRY_UNARCHIVE]: {
    id: AppEventKey.ENTRY_UNARCHIVE,
    text: 'Unarchive',
  },
};

const eventsSelection = {
  title: 'Actions',
  options: AppEvents,
};

const editModeFooter = {
  test: 'Send test message',
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
