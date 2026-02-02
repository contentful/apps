import EntryEditor from './EntryEditor';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor />);

    expect(
      getByText('Hello Entry Editor Component (AppId: posthog-analytics)')
    ).toBeInTheDocument();
  });
});
