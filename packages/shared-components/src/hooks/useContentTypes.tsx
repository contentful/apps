import { ContentType } from '../ContentTypeMultiSelect';

export function useContentTypes(contentTypeIds?: string[]): ContentType[] {
  // TODO: Replace with actual content types fetch
  return [
    { id: 'article', name: 'Article' },
    { id: 'blogPost', name: 'Blog Post' },
    { id: 'product', name: 'Product' },
    { id: 'category', name: 'Category' },
    { id: 'author', name: 'Author' },
    { id: 'page', name: 'Page' },
  ];
}
