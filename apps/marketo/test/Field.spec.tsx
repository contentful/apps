import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockSdk } from './mocks';
import Field from '../src/locations/Field';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: vi.fn(),
}));

describe('Field component', () => {
  it('shows loading state while forms are loading', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => undefined) as unknown as ReturnType<typeof fetch>
    );

    const { getByText } = render(<Field />);

    expect(getByText(/Loading Marketo data/i)).toBeTruthy();
  });
});
