import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { accessSection } from '@constants/configCopy';
import { mockSdk, mockGetManyContentType, mockChannels } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigPage component', () => {
  it('mounts and renders access section', async () => {
    mockSdk.cma.contentType.getMany = vi.fn().mockReturnValueOnce(mockGetManyContentType);
    mockSdk.cma.appActionCall.createWithResponse = vi.fn().mockReturnValueOnce({
      response: {
        body: JSON.stringify({
          ok: true,
          data: mockChannels,
        }),
      },
    });

    render(<ConfigPage />);

    await expect(screen.getByText(accessSection.title)).toBeTruthy();
  });
});
