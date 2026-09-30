import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PlayerCode from './PlayerCode';

/**
 * Player code had no tests of its own when its snippet block and copy button were lifted into
 * `CodeBlock` for the Robots JSON views to share. These are the characterisation tests that say
 * the extraction changed nothing: the snippet it composes, the block it renders it in, the copy
 * button beside it, and the face it renders in — which is the app's default, *not* monospace, and
 * is why `CodeBlock` makes monospace opt-in instead of turning it on for everyone.
 */

const origClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');

afterEach(() => {
  if (origClipboard) {
    Object.defineProperty(window.navigator, 'clipboard', origClipboard);
  } else {
    delete (window.navigator as unknown as Record<string, unknown>).clipboard;
  }
  vi.restoreAllMocks();
});

const params = [
  { name: 'playback-id', value: 'pb_123' },
  { name: 'video-title', value: 'A Title' },
  { name: 'stream-type', value: 'on-demand' },
];

const snippet = () => (screen.getByRole('textbox') as HTMLTextAreaElement).value;

describe('PlayerCode', () => {
  it('renders the mux-player snippet in a read-only block', () => {
    render(<PlayerCode params={params} />);

    expect(snippet()).toContain('<mux-player playback-id="pb_123"');
    expect(snippet()).toContain('metadata-video-title="A Title"');
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox')).toHaveClass('copycodearea');
  });

  it('keeps the app default face — the shared block only goes monospace when asked', () => {
    render(<PlayerCode params={params} />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('style');
  });

  it('still switches the snippet between the two tabs and the three switches', async () => {
    render(<PlayerCode params={params} />);

    await userEvent.click(screen.getByText('Autoplay'));
    expect(snippet()).toContain('autoplay');

    await userEvent.click(screen.getByText('iframe'));
    expect(snippet()).toContain('<iframe src="https://player.mux.com/pb_123');
    expect(snippet()).toContain('autoplay=true');
  });

  it('copies the snippet that is on screen', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    render(<PlayerCode params={params} />);

    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(snippet()));
  });
});
