import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeMultiSelect, { ContentType } from '../../src/components/ContentTypeMultiSelect';

describe('ContentTypeMultiSelect', () => {
  const availableContentTypes: ContentType[] = [
    { id: 'blogPost', name: 'Blog Post' },
    { id: 'article', name: 'Article' },
    { id: 'news', name: 'News' },
  ];

  const TestWrapper = ({ initialSelected = [] }: { initialSelected?: ContentType[] }) => {
    const [selected, setSelected] = React.useState<ContentType[]>(initialSelected);
    return (
      <ContentTypeMultiSelect
        selectedContentTypes={selected}
        setSelectedContentTypes={setSelected}
        availableContentTypes={availableContentTypes}
      />
    );
  };

  it('renders available content types in the dropdown', async () => {
    render(
      <ContentTypeMultiSelect
        selectedContentTypes={[]}
        setSelectedContentTypes={() => {}}
        availableContentTypes={availableContentTypes}
      />
    );
    const user = userEvent.setup();

    const autocomplete = screen.getByPlaceholderText('Select one or more');
    await user.click(autocomplete);

    expect(await screen.findByText('Blog Post')).toBeTruthy();
    expect(await screen.findByText('Article')).toBeTruthy();
    expect(await screen.findByText('News')).toBeTruthy();
  });

  it('selects and deselects content types, showing and removing pills', async () => {
    render(<TestWrapper />);
    const user = userEvent.setup();

    const autocomplete = screen.getByPlaceholderText('Select one or more');
    await user.click(autocomplete);
    const checkbox = await screen.findByRole('checkbox', { name: 'Blog Post' });
    await user.click(checkbox);
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close');
      const pill = closeButton.parentElement;
      expect(pill).toHaveTextContent('Blog Post');
    });

    // Deselect
    await user.click(checkbox);
    await waitFor(() => {
      expect(screen.queryByLabelText('Close')).toBeNull();
    });
  });

  it('shows correct placeholder text', async () => {
    render(<TestWrapper />);
    const user = userEvent.setup();
    const autocomplete = screen.getByPlaceholderText('Select one or more');
    await user.click(autocomplete);
    const checkbox = await screen.findByRole('checkbox', { name: 'Blog Post' });
    await user.click(checkbox);
    expect(screen.getByPlaceholderText('Blog Post')).toBeTruthy();
    const checkbox2 = await screen.findByRole('checkbox', { name: 'Article' });
    await user.click(checkbox2);
    expect(screen.getByPlaceholderText('Blog Post and 1 more')).toBeTruthy();
  });

  it('removes pill when close button is clicked', async () => {
    render(<TestWrapper initialSelected={[{ id: 'blogPost', name: 'Blog Post' }]} />);
    const user = userEvent.setup();
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Close')).toBeNull();
    });
  });

  it('disables autocomplete when all content types are selected', async () => {
    render(<TestWrapper initialSelected={availableContentTypes} />);

    expect(screen.getByPlaceholderText('Blog Post and 2 more')).toBeDisabled();
  });
});
