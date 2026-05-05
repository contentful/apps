export interface QuickAction {
  label: string;
  message: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'List content types',
    message: 'List all content types in this space.',
  },
  {
    label: 'Recent entries',
    message: 'Show me the 10 most recently updated entries.',
  },
  {
    label: 'Create an entry',
    message: 'I want to create a new entry. What content types are available?',
  },
  {
    label: 'Search entries',
    message: 'Help me search for entries. What would you like to search for?',
  },
  {
    label: 'Space info',
    message: 'Show me information about this space and its environments.',
  },
  {
    label: 'List environments',
    message: 'List all environments in this space.',
  },
];
