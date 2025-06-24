import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';
import { ContentType } from '../../src/utils';

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
    expect(screen.getByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Article')).toBeTruthy();
    expect(screen.getByText('News')).toBeTruthy();
  });

  it('selects and deselects content types, showing and removing pills', async () => {
    render(<TestWrapper />);
    const user = userEvent.setup();

    // Click to select 'Blog Post'
    const blogPostOptions = screen.getAllByText('Blog Post');
    const blogPostOption = blogPostOptions.find((el) => !el.closest('button[aria-label="Close"]'));
    await user.click(blogPostOption!);
    expect(await screen.findByLabelText('Close')).toBeInTheDocument();

    // Deselect by clicking the pill's close button
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    expect(screen.queryByLabelText('Close')).toBeNull();
  });

  it('shows correct placeholder text', async () => {
    render(<TestWrapper />);
    const user = userEvent.setup();

    // Select 'Blog Post'
    const blogPostOptions = screen.getAllByText('Blog Post');
    const blogPostOption = blogPostOptions.find((el) => !el.closest('button[aria-label="Close"]'));
    await user.click(blogPostOption!);
    let pill = screen.getByLabelText('Close').parentElement;
    expect(pill).toHaveTextContent('Blog Post');

    // Select 'Article'
    const articleOptions = screen.getAllByText('Article');
    const articleOption = articleOptions.find((el) => !el.closest('button[aria-label="Close"]'));
    await user.click(articleOption!);

    // There should be two pills: 'Blog Post' and 'Article'
    const closeButtons = screen.getAllByLabelText('Close');
    const pillTexts = closeButtons.map((btn) => btn.parentElement?.textContent);
    expect(pillTexts).toContain('Blog Post');
    expect(pillTexts).toContain('Article');
  });

  it('removes pill when close button is clicked', async () => {
    render(<TestWrapper initialSelected={[{ id: 'blogPost', name: 'Blog Post' }]} />);
    const user = userEvent.setup();
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(screen.queryByLabelText('Close')).toBeNull();
  });

  it('shows the correct placeholder text', async () => {
    render(<TestWrapper />);
    expect(screen.getByText('Select one or more')).toBeInTheDocument();
  });
});
