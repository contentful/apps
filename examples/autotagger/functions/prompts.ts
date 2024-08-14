import type { EntryProps } from 'contentful-management';

export function buildAutotagPrompts(entry: EntryProps) {
  return [
    {
      role: 'system',
      content: JSON.stringify(`Suggest a list of several tags for the following Contentful entry. 
              Return a comma-separated list with NO ADDITIONAL FORMATTING, 
              just a comma-separated list of words. 
              The words need to be just letters, no spaces, no special characters. 
              The list should be no longer than 10 tags max.`),
    },
    { role: 'user', content: JSON.stringify(entry) },
  ];
}
