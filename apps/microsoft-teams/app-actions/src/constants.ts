export const TOPIC_ACTION_MAP = {
  'ContentManagement.Entry.create': 'created',
  'ContentManagement.Entry.save': 'saved',
  'ContentManagement.Entry.auto_save': 'auto saved',
  'ContentManagement.Entry.archive': 'archived',
  'ContentManagement.Entry.unarchive': 'unarchived',
  'ContentManagement.Entry.publish': 'published',
  'ContentManagement.Entry.unpublish': 'unpublished',
  'ContentManagement.Entry.delete': 'deleted',
} as const;
