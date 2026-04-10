import ChartFooter from './ChartFooter';
import { render, screen } from '@testing-library/react';

const mockSlugName = 'my-page';
const mockViewUrl = 'https://contentful.com';

describe('Chart Footer for the analytics app', () => {
  it('can render the slug name', () => {
    render(<ChartFooter slugName={mockSlugName} viewUrl={mockViewUrl} />);

    expect(screen.getByText(/my-page/)).toBeVisible();
  });

  it('can render the link to open in Google Analytics', () => {
    render(<ChartFooter slugName={mockSlugName} viewUrl={mockViewUrl} />);

    expect(screen.getByText('Open in Google Analytics')).toBeVisible();
  });

  it('renders included paths summary for aggregated results', () => {
    render(
      <ChartFooter
        slugName="3 rules configured"
        viewUrl=""
        includedPaths={['/category/my-post/', '/interviews/my-post/', '/news/my-post/']}
      />
    );

    expect(screen.getByText('Included paths (3)')).toBeVisible();
    expect(screen.getByText('/category/my-post/')).toBeVisible();
    expect(screen.getByText('/interviews/my-post/')).toBeVisible();
    expect(screen.getByText('/news/my-post/')).toBeVisible();
    expect(screen.queryByText('Open in Google Analytics')).not.toBeInTheDocument();
  });
});
