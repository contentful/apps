import React from 'react';
import ConfigScreen from './ConfigScreen';
import { fireEvent, render, waitFor } from '@testing-library/react';
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

  it('persists the configured default include depth', async () => {
    mockSdk.app.getParameters.mockResolvedValueOnce({
      configOptions: {
        displayDataTypes: 'false',
        iconStyle: 'triangle',
        collapsed: 'false',
        theme: 'rjv-default',
        defaultIncludeDepth: '0',
      },
    });

    const { container } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    fireEvent.change(container.querySelector('select[name="defaultIncludeDepth"]')!, {
      target: { value: '3' },
    });

    const configuredState = await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();

    expect(configuredState.parameters.configOptions.defaultIncludeDepth).toBe('3');
  });
});
