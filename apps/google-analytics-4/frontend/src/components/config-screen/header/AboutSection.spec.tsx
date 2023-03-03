import AboutSection from './AboutSection';
import { act, render, screen } from '@testing-library/react';

describe('About header for the Analytics Config Page', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(<AboutSection />);
    });

    expect(screen.getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });
});
