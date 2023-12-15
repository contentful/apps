const mockEntry = {
  metadata: {
    tags: [],
  },
  sys: {
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: '123456',
      },
    },
    id: 'abc123',
    type: 'Entry',
    createdAt: '2023-08-25T15:10:27.806Z',
    updatedAt: '2023-09-01T00:46:53.890Z',
    environment: {
      sys: {
        id: 'staging',
        type: 'Link',
        linkType: 'Environment',
      },
    },
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'qwerty890',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'qwerty890',
      },
    },
    publishedCounter: 0,
    version: 4,
    automationTags: [],
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: 'page',
      },
    },
  },
  fields: {
    title: {
      'en-US': 'Sample Title',
    },
  },
};

export { mockEntry };
