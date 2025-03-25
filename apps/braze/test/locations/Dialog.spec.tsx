import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    expect(true).toBeTruthy(); // TODO: replace
  });
});
