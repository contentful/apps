import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';
import { ContentType } from '../../src/utils';
import { vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { createClient } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('ContentTypeMultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCma.contentType.getMany.mockResolvedValue({
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
    render(<TestWrapper />);
  });

  afterEach(() => {
    cleanup();
  });

  const TestWrapper = ({ initialSelected = [] }: { initialSelected?: ContentType[] }) => {
    const sdk = useSDK<ConfigAppSDK>();
    const cma = createClient(
      { apiAdapter: sdk.cmaAdapter },
      {
        type: 'plain',
        defaults: {
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          spaceId: sdk.ids.space,
        },
      }
    );
    const [selected, setSelected] = React.useState<ContentType[]>(initialSelected);
    return (
      <ContentTypeMultiSelect
        selectedContentTypes={selected}
        setSelectedContentTypes={setSelected}
        sdk={sdk}
        cma={cma}
      />
    );
  };

  it('shows the correct input placeholder text', async () => {
    expect(screen.getByText('Select one or more')).toBeInTheDocument();
  });

  it('renders available content types in the dropdown', async () => {
    expect(await screen.findByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Article')).toBeTruthy();
    expect(screen.getByText('News')).toBeTruthy();
  });

  it('selects and deselects content types, showing and removing pills', async () => {
    const user = userEvent.setup();

    const blogPostOption = await screen.findByText('Blog Post');
    await user.click(blogPostOption);
    expect(await screen.findByLabelText('Close')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    expect(screen.queryByLabelText('Close')).toBeNull();
  });

  it('shows correct pill placeholder text', async () => {
    const user = userEvent.setup();

    const blogPostOption = await screen.findByText('Blog Post');
    await user.click(blogPostOption);
    let pill = screen.getByLabelText('Close').parentElement;
    expect(pill).toHaveTextContent('Blog Post');

    const articleOption = screen.getByText('Article');
    await user.click(articleOption);

    const closeButtons = screen.getAllByLabelText('Close');
    const pillTexts = closeButtons.map((btn) => btn.parentElement?.textContent);
    expect(pillTexts).toContain('Blog Post');
    expect(pillTexts).toContain('Article');
  });

  it('removes pill when close button is clicked', async () => {
    const user = userEvent.setup();
    const blogPostOption = await screen.findByText('Blog Post');
    await user.click(blogPostOption);

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(screen.queryByLabelText('Close')).toBeNull();
  });
});
