import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();
    const element = getByText('When set to true, all nodes will be collapsed by default');
    expect(element.hasAttribute('class')).toBe(true);
  });
});
