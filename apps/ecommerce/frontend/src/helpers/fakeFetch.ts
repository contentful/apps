import { HydratedResourceData, ResourceLink } from '../types';

const fetchRemoteData = async (
  resource: ResourceLink,
  index?: number
): Promise<HydratedResourceData> => {
  return new Promise((resolve) => {
    const randomTimeout = Math.floor(Math.random() * 3000) + 200; // between 200 and 3000 ms

    setTimeout(async () => {
      if (index && index === 1) {
        resolve({});
      } else {
        resolve({
          name: `Product ${index ? index + 1 : ''}`,
          description: 'Lorem ipsum dolar sit amet',
          image: 'https://placekitten.com/500/500',
          status: 'new',
          extras: {
            sku: 'abc123',
          },
        });
      }
    }, randomTimeout);
  });
};

export default fetchRemoteData;
