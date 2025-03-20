import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import CodeBlock from './CodeBlock';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('CodeBlock component', () => {
  const code = '{{liquidTag}}';
  const codeBlockComponent = render(<CodeBlock code={code} />);
  it('Component code exists', () => {
    const codeContent = codeBlockComponent.getByTestId('code-component');

    expect(codeContent).toBeTruthy();
  });

  it('Component copy exists', async () => {
    const user = userEvent.setup();

    const copyButton = screen.getByRole('button');
    await user.click(copyButton);

    const clipboardText = await navigator.clipboard.readText();
    expect(clipboardText).toBe(code);
  });
});
