import AboutSection from './AboutSection';
import { act, render, screen } from '@testing-library/react';

describe('About header for the Analytics Config Page', () => {
  it('can render the about section', async () => {
    act(() => {
      render(<AboutSection />);
    });

    expect(screen.getByText('About Google Analytics 4 for Contentful')).toBeInTheDocument();
  });
});
