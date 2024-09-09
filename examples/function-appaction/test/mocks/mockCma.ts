import { CollectionProp, AppActionProps } from 'contentful-management';

const mockCma: any = {
  appAction: {
    getMany: (): Promise<CollectionProp<AppActionProps>> =>
      Promise.resolve({
        sys: { type: 'Array' },
        total: 0,
        skip: 0,
        limit: 0,
        items: [
          {
            sys: { id: 'id', type: 'AppAction' },
            category: 'Custom',
            parameters: [],
            url: 'www.url.com',
            name: 'name',
            description: 'description',
          } as unknown as AppActionProps,
        ],
      }),
  },
};

export { mockCma };
