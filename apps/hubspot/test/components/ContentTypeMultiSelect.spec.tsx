import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';
import { ContentType } from '../../src/utils/utils';
import { mockSdk } from '../mocks';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ContentTypeMultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'news' }, name: 'News' },
      ],
      total: 3,
      skip: 0,
      limit: 100,
      sys: { type: 'Array' },
    });
  });

  afterEach(() => {
    cleanup();
  });

  const TestWrapper = ({ initialSelected = [] }: { initialSelected?: ContentType[] }) => {
    const sdk = useSDK<ConfigAppSDK>();
    const [selected, setSelected] = React.useState<ContentType[]>(initialSelected);
    return (
      <ContentTypeMultiSelect
        selectedContentTypes={selected}
        setSelectedContentTypes={setSelected}
        sdk={sdk}
      />
    );
  };

  it('shows the correct input placeholder text', async () => {
    render(<TestWrapper />);
    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });

  it('renders available content types in the dropdown', async () => {
    render(<TestWrapper />);
    expect(await screen.findByText('Blog Post')).toBeTruthy();

    expect(screen.getByText('Article')).toBeTruthy();
    expect(screen.getByText('News')).toBeTruthy();
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
