import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Sidebar from './Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

const BUTTON_TEXT = 'Generate Braze Connected Content';
const DIALOG_TITLE = 'Generate Braze Connected Content Call';

describe('Sidebar component', () => {
  const { getByText } = render(<Sidebar />);

  it('Component text exists', () => {
    expect(getByText(BUTTON_TEXT)).toBeTruthy();
  });

  it('Button opens a dialog', () => {
    getByText('Generate Braze Connected Content').click();
    expect(mockSdk.dialogs.openCurrentApp).toBeCalled(); // TODO: add parameters
  });
});
