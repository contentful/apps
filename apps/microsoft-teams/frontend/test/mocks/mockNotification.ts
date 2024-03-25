import { Notification } from '@customTypes/configPage';

const mockNotification: Notification = {
  channel: {
    id: 'abc-123',
    name: 'Corporate Marketing',
    teamId: '789-def',
    teamName: 'Marketing Department',
    tenantId: '9876-5432',
  },
  contentTypeId: 'blogPost',
  contentTypeName: 'Blog Post',
  selectedEvents: {
    'ContentManagement.Entry.publish': true,
    'ContentManagement.Entry.unpublish': true,
    'ContentManagement.Entry.create': true,
    'ContentManagement.Entry.delete': true,
    'ContentManagement.Entry.archive': true,
    'ContentManagement.Entry.unarchive': true,
  },
};

export { mockNotification };
