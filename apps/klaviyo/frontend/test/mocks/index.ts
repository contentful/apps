export { mockSdk } from './mockSdk';
export { mockCma } from './mockCma';

// Additional mock objects
export const mockEntryData = {
  sys: {
    id: 'entry123',
    contentType: {
      sys: {
        id: 'blogPost',
      },
    },
  },
  fields: {
    title: {
      'en-US': 'Test Title',
    },
    content: {
      'en-US': 'Test Content',
    },
    image: {
      'en-US': {
        sys: {
          id: 'asset1',
          type: 'Link',
          linkType: 'Asset',
        },
      },
    },
  },
};

export const mockMappings = [
  { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' },
  { contentfulFieldId: 'content', klaviyoBlockName: 'Content', fieldType: 'text' },
  { contentfulFieldId: 'image', klaviyoBlockName: 'Featured Image', fieldType: 'image' },
];

export const mockAssetData = {
  sys: {
    id: 'asset1',
  },
  fields: {
    title: {
      'en-US': 'Test Image',
    },
    description: {
      'en-US': 'Test Description',
    },
    file: {
      'en-US': {
        url: '//images.ctfassets.net/test.jpg',
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
      },
    },
  },
};
