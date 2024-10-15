import React from 'react';
import { cleanup, render, fireEvent, configure } from '@testing-library/react';

import ConnectButton from '../src/ConnectButton';
import { vi } from 'vitest';

configure({ testIdAttribute: 'data-test-id' });

describe('ConnectButton', () => {
  afterEach(cleanup);

  it('should handle the openAuth functionality onClick', () => {
    const openMock = vi.fn();
    const { getByTestId } = render(<ConnectButton openAuth={openMock} />);

    fireEvent.click(getByTestId('connect-button'));

    expect(openMock).toHaveBeenCalledTimes(1);
  });
});
