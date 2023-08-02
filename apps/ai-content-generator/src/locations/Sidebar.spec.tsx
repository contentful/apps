import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk } from '../../test/mocks';
import Sidebar from './Sidebar';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  it('Component text exists', () => {
    // const { getByText } = render(<Sidebar />);
    // expect(getByText('Title')).toBeTruthy();
  });
});
