import MsAuthorization from './MsAuthorization';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mockMsal } from '@test/mocks';

vi.mock('@azure/msal-react', async () => {
  const actual = await vi.importActual('@azure/msal-react');
  return {
    ...(actual as object),
    useMsal: () => mockMsal,
  };
});

describe('MsAuthorization component', () => {
  it('mounts with unauthenticated text', () => {
    render(<MsAuthorization />);

    expect(screen.getByText('Connect to Teams')).toBeTruthy();
  });
});
