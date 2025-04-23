import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SIDEBAR_BUTTON_TEXT, DIALOG_TITLE } from '../../src/utils';
import { mockSdk, mockCma } from '../mocks';
import Sidebar from '../../src/locations/Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Sidebar component', () => {
  const { getByText } = render(<Sidebar />);

  it('Component text exists', () => {
    expect(getByText(SIDEBAR_BUTTON_TEXT)).toBeTruthy();
  });

  it('Button opens a dialog', () => {
    getByText(SIDEBAR_BUTTON_TEXT).click();
    expect(mockSdk.dialogs.openCurrentApp).toBeCalledWith({
      title: DIALOG_TITLE,
      parameters: {
        id: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        title: 'Title',
      },
      width: 'fullWidth',
    });
  });
});
