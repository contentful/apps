import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeMultiSelect } from '../src/ContentTypeMultiSelect';
import { beforeEach, vi, afterEach, describe, it, expect } from 'vitest';
import { mockSdk } from './mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ContentTypeMultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockSdk.cma.contentType.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'product' }, name: 'Product' },
        { sys: { id: 'category' }, name: 'Category' },
        { sys: { id: 'author' }, name: 'Author' },
        { sys: { id: 'page' }, name: 'Page' },
      ],
      total: 6,
      skip: 0,
      limit: 1000,
      sys: { type: 'Array' },
    });
  });

  afterEach(() => {
    cleanup();
  });

  const TestWrapper = ({ initialSelected = [] }: { initialSelected?: string[] }) => {
    const [selected, setSelected] = React.useState<string[]>(initialSelected);
    return (
      <ContentTypeMultiSelect
        selectedContentTypesIds={selected}
        setSelectedContentTypesIds={setSelected}
      />
    );
  };

  it('shows the correct input placeholder text', async () => {
    render(<TestWrapper />);
    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });

  it('renders available content types in the dropdown', async () => {
    render(<TestWrapper />);
    expect(await screen.findByText('Article')).toBeTruthy();
    expect(screen.getByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Product')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Author')).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('selects and deselects content types, showing and removing pills', async () => {
    render(<TestWrapper />);
    const user = userEvent.setup();

    // Wait for content types to be loaded
    const blogPostOption = await screen.findByText('Blog Post');

    await user.click(blogPostOption);

    expect(await screen.findByLabelText('Close')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Close')).toBeNull();
    });
  });

  it('shows correct pill placeholder text', async () => {
    render(<TestWrapper />);
    const user = userEvent.setup();

    // Wait for content types to be loaded
    const blogPostOption = await screen.findByText('Blog Post');

    await user.click(blogPostOption);

    const pill = (await screen.findByLabelText('Close')).parentElement;
    expect(pill).toHaveTextContent('Blog Post');

    const articleOption = screen.getByText('Article');
    await user.click(articleOption);

    const closeButtons = await screen.findAllByLabelText('Close');
    const pillTexts = closeButtons.map((btn) => btn.parentElement?.textContent);
    expect(pillTexts).toContain('Blog Post');
    expect(pillTexts).toContain('Article');
  });
});
