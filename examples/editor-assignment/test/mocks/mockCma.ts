const mockCma: any = {
  contentType: {
    getMany() {
      return {
        items: [
          {
            sys: {
              space: {
                sys: {
                  type: 'Link',
                  linkType: 'Space',
                  id: 'spaceidhere',
                },
              },
              id: 'post',
              type: 'ContentType',
              createdAt: '2020-02-05T12:50:33.349Z',
              updatedAt: '2022-04-14T11:51:26.712Z',
              environment: {
                sys: {
                  id: 'master',
                  type: 'Link',
                  linkType: 'Environment',
                },
              },
            },
            displayField: 'title',
            name: 'POST',
            description: null,
            fields: [
              {
                id: 'title',
                name: 'Title',
                type: 'Symbol',
                localized: false,
                required: true,
                validations: [],
                disabled: false,
                omitted: false,
              },
              {
                id: 'postText',
                name: 'Post Text',
                type: 'Text',
                localized: false,
                required: true,
                validations: [],
                disabled: false,
                omitted: false,
              },
            ],
          },
        ],
      };
    },
  },
  editorInterface: {
    getMany() {
      return {
        items: [
          {
            sys: {
              type: 'EditorInterface',
              space: {
                sys: {
                  id: 'spaceidhere',
                  type: 'Link',
                  linkType: 'Space',
                },
              },
              contentType: {
                sys: {
                  id: 'category',
                  type: 'post',
                  linkType: 'ContentType',
                },
              },
              environment: {
                sys: {
                  id: 'master',
                  type: 'Link',
                  linkType: 'Environment',
                },
              },
            },
            sidebar: [],
            controls: [],
          },
        ],
      };
    },
  },
};

export { mockCma };
