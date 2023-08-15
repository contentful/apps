import type { Meta, StoryObj } from '@storybook/react';
import { Paginator } from './index';
import { GlobalStyles } from '@contentful/f36-components';
import { useState } from 'react';

const meta: Meta<typeof Paginator> = {
  component: Paginator,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Paginator>;

export const Default: Story = {
  args: {
    activePage: 0,
    pageCount: 10,
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [activePage, setActivePage] = useState(() => args.activePage);
    return (
      <Paginator activePage={activePage} setActivePage={setActivePage} pageCount={args.pageCount} />
    );
  },
  decorators: [
    (Story) => (
      <>
        <GlobalStyles />
        <Story />
      </>
    ),
  ],
};
