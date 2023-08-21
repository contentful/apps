import { StoryFn } from '@storybook/react';
import { GlobalStyles } from '@contentful/f36-components';

export const parameters = {
  tags: ['autodocs'],
  decorators: [
    (Story: StoryFn) => (
      <div style={{ width: '700px' }}>
        <GlobalStyles />
        <Story />
      </div>
    ),
  ],
};
