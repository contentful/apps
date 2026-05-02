import AboutSection from './AboutSection';
import { render, screen } from '@testing-library/react';

describe('About header for the Analytics Config Page', () => {
  it('can render the about section', () => {
    render(<AboutSection />);

    expect(screen.getByText('About Google Analytics 4 for Contentful')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The Google Analytics 4 app displays real-time page-based analytics data from your organization’s Google Analytics 4 properties in the editor sidebar of configured content entries.'
      )
    ).toBeInTheDocument();
  });
});
