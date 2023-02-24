import ChartFooter from './ChartFooter';
import { render, screen } from '@testing-library/react';

describe('Chart Footer for the sidebar app', () => {
  it('can render the slug name', () => {
    render(<ChartFooter slugName="my-page" viewUrl="https://contentful.com" />);

    expect(screen.getByText('my-page')).toBeInTheDocument();
  });

  it('can render the link to open in Google Analytics', () => {
    render(<ChartFooter slugName="my-page" viewUrl="https://contentful.com" />);

    expect(screen.getByText('Open in Google Analytics')).toBeInTheDocument();
  });
});
