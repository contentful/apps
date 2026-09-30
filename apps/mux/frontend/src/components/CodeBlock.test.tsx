import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CodeBlock from './CodeBlock';

/**
 * The block Player code has always rendered, now shared with the Robots JSON views.
 *
 * The copy tests are the load-bearing ones. This app runs inside the Contentful iframe, where the
 * async clipboard API is not reliably granted, and f36's `CopyButton` is used precisely because it
 * falls back to `document.execCommand('copy')` when `navigator.clipboard` is missing or rejects.
 * A hand-rolled `navigator.clipboard.writeText` would pass a naive test and silently do nothing in
 * the iframe, so both paths are pinned here.
 */

const origClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
const origExecCommand = (document as unknown as Record<string, unknown>).execCommand;

const setClipboard = (writeText: unknown) =>
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });

afterEach(() => {
  if (origClipboard) {
    Object.defineProperty(window.navigator, 'clipboard', origClipboard);
  } else {
    delete (window.navigator as unknown as Record<string, unknown>).clipboard;
  }
  (document as unknown as Record<string, unknown>).execCommand = origExecCommand;
  vi.restoreAllMocks();
});

const block = (props: Partial<React.ComponentProps<typeof CodeBlock>> = {}) =>
  render(
    <CodeBlock
      value="line one"
      tooltipText="Copy it"
      tooltipCopiedText="Copied it"
      testId="the-block"
      {...props}
    />
  );

const copyButton = () => screen.getByRole('button', { name: /copy/i });

describe('CodeBlock', () => {
  it('shows the value verbatim in a read-only block that scrolls in its own box', () => {
    const multiline = '{\n  "a": 1\n}';
    block({ value: multiline });

    const area = screen.getByTestId('the-block') as HTMLTextAreaElement;
    expect(area.tagName).toBe('TEXTAREA');
    // Verbatim, newlines and all — a JSON payload that arrives reflowed is not the payload.
    expect(area.value).toBe(multiline);
    expect(area).toHaveAttribute('readonly');
    // `.copycodearea` is what floors the block's height so it scrolls rather than growing the
    // page; Player code has always relied on it and the JSON views inherit it.
    expect(area).toHaveClass('copycodearea');
  });

  it('hands the copy button the same text it shows', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    block({ value: '{"copied":true}' });

    await userEvent.click(copyButton());

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('{"copied":true}'));
  });

  it('still copies when the iframe denies the clipboard API', async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error('NotAllowedError')));
    const execCommand = vi.fn().mockReturnValue(true);
    (document as unknown as Record<string, unknown>).execCommand = execCommand;
    block({ value: 'fallback text' });

    await userEvent.click(copyButton());

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
  });

  it('is monospace only when asked, so Player code keeps the face it had', () => {
    const { unmount } = block({ value: 'plain' });
    expect(screen.getByTestId('the-block')).not.toHaveAttribute('style');
    unmount();

    block({ value: 'mono', isMonospace: true });
    expect(screen.getByTestId('the-block')).toHaveStyle({
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
    });
  });

  it('leaves f36 to name the block when no test id is given', () => {
    block({ testId: undefined });
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-testid');
  });
});
