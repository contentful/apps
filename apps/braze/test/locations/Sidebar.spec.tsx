import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  DIALOG_TITLE,
  SIDEBAR_GENERATE_BUTTON_TEXT,
  SIDEBAR_CREATE_BUTTON_TEXT,
} from '../../src/utils';
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
  const dialogParameters = {
    title: DIALOG_TITLE,
    parameters: {
      id: mockSdk.ids.entry,
      contentTypeId: mockSdk.ids.contentType,
      title: 'Title',
    },
    width: 'fullWidth',
  };

  it('Generate button text exists', () => {
    const button = getByText(SIDEBAR_GENERATE_BUTTON_TEXT);

    expect(button).toBeTruthy();
    expect(button.innerText).toBe(SIDEBAR_GENERATE_BUTTON_TEXT);
  });

  it('Create button text exists', () => {
    const button = getByText(SIDEBAR_CREATE_BUTTON_TEXT);

    expect(button).toBeTruthy();
    expect(button.innerText).toBe(SIDEBAR_CREATE_BUTTON_TEXT);
  });

  it('Generate button opens a dialog', () => {
    getByText(SIDEBAR_GENERATE_BUTTON_TEXT).click();

    expect(mockSdk.dialogs.openCurrentApp).toBeCalledWith(dialogParameters);
  });

  it('Create button opens a dialog', () => {
    getByText(SIDEBAR_CREATE_BUTTON_TEXT).click();

    expect(mockSdk.dialogs.openCurrentApp).toBeCalledWith(dialogParameters);
  });
});
