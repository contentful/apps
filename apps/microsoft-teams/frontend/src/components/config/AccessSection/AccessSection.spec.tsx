import AccessSection from './AccessSection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { accessSection } from '@constants/configCopy';

vi.mock('@context/AuthProvider', () => ({
  default: () => {
    return <div>Auth</div>;
  },
}));

describe('AccessSection component', () => {
  it('displays correct copy', () => {
    const { unmount } = render(<AccessSection />);

    expect(screen.getByText(accessSection.title)).toBeTruthy();
    unmount();
  });
});
