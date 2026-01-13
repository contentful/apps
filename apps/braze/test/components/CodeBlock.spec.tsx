import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../mocks';
import CodeBlock from '../../src/components/CodeBlock';
import { screen, render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('CodeBlock component', () => {
  const code = '{{liquidTag}}';

  afterEach(() => {
    cleanup();
  });

  it('Component code exists', () => {
    const codeBlockComponent = render(<CodeBlock code={code} showCopyButton />);
    const codeContent = codeBlockComponent.getByTestId('code-component');

    expect(codeContent).toBeTruthy();
  });

  it('Component copy exists and copy the code if it is enabled', async () => {
    const codeBlockComponent = render(<CodeBlock code={code} showCopyButton />);
    const user = userEvent.setup();

    const copyButton = screen.getByRole('button');
    await user.click(copyButton);

    const clipboardText = await navigator.clipboard.readText();
    expect(codeBlockComponent.getByTestId('copy-button')).toBeTruthy();
    expect(clipboardText).toBe(code);
  });

  it('Component copy doesnt exists if it is not enabled', async () => {
    const component = render(<CodeBlock code={code} />);

    expect(component.queryByTestId('copy-button')).toBeNull();
  });
});
