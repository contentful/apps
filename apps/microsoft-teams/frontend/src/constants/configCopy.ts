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
    'Authorize your Microsoft Account here. Then, add the Contentful app to your Teams channel.',
  fieldName: 'Tenant Id',
  login: 'Connect Microsoft Account',
  logout: 'Disconnect',
  retry: 'Retry Authorization',
  teamsAppInfo:
    'Install the Contentful app in Microsoft Teams channels where you would like to receive notifications.  View Teams docs',
  teamsAppLink: 'View Teams docs',
  disconnectModal: {
    confirmDisconnect: 'Disconnect',
    goBack: 'Go back',
    description:
      'By disconnecting, you will no longer see configured notifications for this account. Are you sure you want to disconnect?',
  },
  updateConfirmation: 'Microsoft organization updated',
  saveWarning: 'Save the app to persist these settings',
  authError: 'Unable to connect to Microsoft. Check your credentials and try again.',
  orgDetailsError: 'Failed to get Microsoft organization details',
};

const notificationsSection = {
  title: 'Notifications',
  description: 'Specify Microsoft Teams channels, content types, and entry actions.',
  createButton: 'Create notification',
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete:
    'If you delete this notification you will no longer get updates about this content type in Microsoft Teams.',
  duplicateModal: {
    modalHeaderTitle: 'Duplicate Notification',
    confirmDuplicate: 'Yes',
    goBack: 'Cancel',
    confirmDuplicateDescription:
      'You already have a notification set up for this content type and Teams channel. Do you want to make changes to the existing notification?',
    confirmDuplicateDescriptionTwo:
      'If yes, edits to entry actions will apply to your existing notification.  If you prefer to cancel, you can then edit the content type or Teams channel.',
  },
  updateConfirmation: 'Notification settings updated',
  saveWarning: 'Save the app to persist these settings',
  pendingChangesWarning: 'Notification changes are not saved. Please try again.',
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
    errorMessage: 'Content types did not load. Please try again later.',
    searchPlaceholder: 'Search for a content type',
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
    link: 'Add the app',
    button: 'Select',
    emptyHeading: 'Add Microsoft Teams channels',
    emptyContent:
      'In Microsoft Teams, add the Contentful app to the general channel of the teams where you want to see notifications. Add the app and then refresh the page.',
    errorMessage: 'Channels did not load. Please try again later.',
    searchPlaceholder: 'Search for a channel',
  },
  notFound: 'Teams channel not found',
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
  testSuccess: 'A test message was sent',
  testError: 'Failed to send test message',
  cancel: 'Cancel',
  create: 'Create',
  update: 'Update',
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
