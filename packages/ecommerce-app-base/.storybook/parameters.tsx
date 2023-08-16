import { StoryFn } from '@storybook/react';

export const parameters = {
  tags: ['autodocs'],
  decorators: [
    (Story: StoryFn) => (
      <div style={{ width: '700px' }}>
        <Story />
      </div>
    ),
  ],
};
