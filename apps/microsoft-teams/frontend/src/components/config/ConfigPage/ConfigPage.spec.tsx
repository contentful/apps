import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { accessSection, notificationsSection } from '@constants/configCopy';

describe('ConfigPage component', () => {
  it('mounts and renders the correct sections', () => {
    render(<ConfigPage handleConfig={vi.fn()} parameters={{}} />);

    expect(screen.getByText(accessSection.title)).toBeTruthy();
    expect(screen.getByText(notificationsSection.title)).toBeTruthy();
  });
});
