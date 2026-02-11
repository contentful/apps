import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeMultiSelect from '../src/ContentTypeMultiSelect';
import { afterEach, describe, expect, it } from 'vitest';

vi.mock('../src/hooks/useContentTypes', () => ({
  useContentTypes: () => [
    { id: 'article', name: 'Article' },
    { id: 'blogPost', name: 'Blog Post' },
    { id: 'product', name: 'Product' },
    { id: 'category', name: 'Category' },
    { id: 'author', name: 'Author' },
    { id: 'page', name: 'Page' },
  ],
}));

describe('ContentTypeMultiSelect', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the correct input placeholder text', async () => {
    render(<ContentTypeMultiSelect selectedContentTypes={[]} setSelectedContentTypes={() => {}} />);

    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });

  it('renders available content types in the dropdown', async () => {
    render(<ContentTypeMultiSelect selectedContentTypes={[]} setSelectedContentTypes={() => {}} />);

    expect(await screen.findByText('Article')).toBeTruthy();
    expect(screen.getByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Product')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Author')).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('selects and deselects content types, showing and removing pills', async () => {
    render(<ContentTypeMultiSelect selectedContentTypes={[]} setSelectedContentTypes={() => {}} />);

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
    render(<ContentTypeMultiSelect selectedContentTypes={[]} setSelectedContentTypes={() => {}} />);

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

  it('display the max amount of content types correctly', async () => {
    render(
      <ContentTypeMultiSelect
        selectedContentTypes={[]}
        setSelectedContentTypes={() => {}}
        maxSelected={2}
      />
    );

    expect(await screen.findByText('Article')).toBeTruthy();
    expect(screen.getByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Product')).not.toBeInTheDocument();
    expect(screen.getByText('Category')).not.toBeInTheDocument();
    expect(screen.getByText('Author')).not.toBeInTheDocument();
    expect(screen.getByText('Page')).not.toBeInTheDocument();
  });
});
