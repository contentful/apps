import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk, mockGetManyContentType, mockChannels } from '@test/mocks';
import ConfigScreen from './ConfigScreen';
import { headerSection } from '@constants/configCopy';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    mockSdk.cma.contentType.getMany = vi.fn().mockReturnValueOnce(mockGetManyContentType);
    mockSdk.cma.appActionCall.createWithResponse = vi.fn().mockReturnValueOnce({
      response: {
        body: JSON.stringify({
          ok: true,
          data: mockChannels,
        }),
      },
    });

    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText(headerSection.title)).toBeTruthy();
  });
});
