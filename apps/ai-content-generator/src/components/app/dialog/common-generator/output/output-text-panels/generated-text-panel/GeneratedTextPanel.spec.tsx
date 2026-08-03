import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '@test/mocks';
import GeneratedTextPanel from './GeneratedTextPanel';
import useAI from '@hooks/dialog/useAI';
import { Tabs } from '@contentful/f36-components';
import { OutputTab } from '../../Output';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('GeneratedTextPanel', () => {
  it('renders', () => {
    const hook = renderHook(() => useAI());
    const { getByText, unmount, rerender } = render(
      <Tabs currentTab={OutputTab.GENERATED_TEXT}>
        <GeneratedTextPanel
          generate={() => {}}
          ai={hook.result.current}
          outputFieldValidation={null}
          apply={() => {}}
        />
      </Tabs>
    );
    expect(getByText('Regenerate')).toBeTruthy();
    hook.result.current.output = 'test';

    rerender(
      <Tabs currentTab={OutputTab.GENERATED_TEXT}>
        <GeneratedTextPanel
          generate={() => {}}
          ai={hook.result.current}
          outputFieldValidation={null}
          apply={() => {}}
        />
      </Tabs>
    );

    expect(getByText('4 characters')).toBeTruthy();
    unmount();
  });

  it('renders the loading skeleton while generating', () => {
    const hook = renderHook(() => useAI());
    hook.result.current.isGenerating = true;

    const { container, getByText, unmount } = render(
      <Tabs currentTab={OutputTab.GENERATED_TEXT}>
        <GeneratedTextPanel
          generate={() => {}}
          ai={hook.result.current}
          outputFieldValidation={null}
          apply={() => {}}
        />
      </Tabs>
    );

    expect(container.querySelector('[data-test-id="generated-text-skeleton"]')).toBeTruthy();
    expect(getByText('Stop Generating')).toBeTruthy();
    unmount();
  });

  it("Renders length error when output field doesn't meet length requirements", () => {
    const hook = renderHook(() => useAI());
    const { getByText, unmount } = render(
      <Tabs currentTab={OutputTab.GENERATED_TEXT}>
        <GeneratedTextPanel
          generate={() => {}}
          ai={hook.result.current}
          outputFieldValidation={{
            size: {
              min: 5,
              max: 10,
            },
          }}
          apply={() => {}}
        />
      </Tabs>
    );

    expect(getByText('Requires between 5 and 10 characters')).toBeTruthy();
    unmount();
  });
});
