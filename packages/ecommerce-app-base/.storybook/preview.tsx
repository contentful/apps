import type { Preview } from '@storybook/react';
import { StoryFn } from '@storybook/react';
import { GlobalStyles } from '@contentful/f36-components';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story: StoryFn) => (
      <>
        <GlobalStyles />
        <Story />
      </>
    ),
  ],
};

export default preview;
