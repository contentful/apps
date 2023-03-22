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
});
