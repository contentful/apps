import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeMultiSelect } from '../src/ContentTypeMultiSelect';
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
    render(
      <ContentTypeMultiSelect selectedContentTypesIds={[]} setSelectedContentTypesIds={() => {}} />
    );

    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });

  it('renders available content types in the dropdown', async () => {
    render(
      <ContentTypeMultiSelect selectedContentTypesIds={[]} setSelectedContentTypesIds={() => {}} />
    );

    expect(await screen.findByText('Article')).toBeTruthy();
    expect(screen.getByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Product')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Author')).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('shows correct pill labels for selected content types', async () => {
    render(
      <ContentTypeMultiSelect
        selectedContentTypesIds={['blogPost', 'article']}
        setSelectedContentTypesIds={() => {}}
      />
    );

    const closeButtons = await screen.findAllByLabelText('Close');
    const pillTexts = closeButtons.map((btn) => btn.parentElement?.textContent);
    expect(pillTexts).toContain('Blog Post');
    expect(pillTexts).toContain('Article');
  });

  it('removes the pill after deselecting a content type', async () => {
    const Wrapper = () => {
      const [selected, setSelected] = useState(['blogPost']);
      return (
        <ContentTypeMultiSelect
          selectedContentTypesIds={selected}
          setSelectedContentTypesIds={setSelected}
        />
      );
    };

    render(<Wrapper />);

    const user = userEvent.setup();

    // Pill should be visible initially
    const closeButton = await screen.findByLabelText('Close');
    expect(closeButton.parentElement).toHaveTextContent('Blog Post');

    await user.click(closeButton);

    // Pill should disappear after deselection
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('does not display other content types pills when maxSelected is reached', async () => {
    render(
      <ContentTypeMultiSelect
        selectedContentTypesIds={['article', 'blogPost']}
        setSelectedContentTypesIds={() => {}}
        maxSelected={2}
      />
    );

    const user = userEvent.setup();

    await user.click(screen.getByText('Product'));

    const closeButtons = screen.getAllByLabelText('Close');
    expect(closeButtons).toHaveLength(2);
  });
});
