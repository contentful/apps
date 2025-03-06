import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { mockCma, mockSdk } from '../../test/mocks';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]();
    });

    expect(
      getByText('Provide the API Read Access Token for TMDB')
    ).toBeDefined();
  });
});
