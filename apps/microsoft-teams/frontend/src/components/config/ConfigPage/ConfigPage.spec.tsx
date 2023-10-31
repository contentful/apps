import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ConfigPage component', () => {
  it('mounts and renders input field', () => {
    render(<ConfigPage handleConfig={vi.fn()} parameters={{}} />);

    expect(screen.getByText('Tenant Id')).toBeTruthy();
  });
});
