import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from '@contentful/f36-components';
import FieldModal from './FieldModal';
import RobotsRunModal from './Robots/RobotsRunModal';
import RobotsOutputViewer from './Robots/RobotsOutputViewer';
import ApplyToEntryModal from './Robots/ApplyToEntryModal';
import MuxAssetConfigurationModal from './AssetConfiguration/MuxAssetConfigurationModal';

/**
 * The field location's viewport is its own iframe, kept as tall as its content. F36 centres a
 * modal in that viewport and caps it at 100vh - 100px, which squeezed modals opened from a short
 * tab and put those opened from a tall one below what the editor could see. The placement and the
 * growth are asserted here; that the result is on screen was checked in a browser.
 */

type Entries = Array<{ intersectionRect: { top: number; height: number } }>;

/** An observer that answers with the given visible region, or never. */
const installObserver = (visible?: { top: number; height: number }) => {
  const observe = vi.fn();
  class FakeObserver {
    callback: (entries: Entries) => void;
    constructor(callback: (entries: Entries) => void) {
      this.callback = callback;
    }
    observe() {
      observe();
      if (visible) setTimeout(() => this.callback([{ intersectionRect: visible }]), 0);
    }
    disconnect() {
      /* nothing held */
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return observe;
};

/** jsdom has no layout, so the modal's box is given a height. */
const MODAL_HEIGHT = 600;
const SHORT_MODAL_HEIGHT = 200;
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

const box = () => document.querySelector('[data-modal-root]') as HTMLElement | null;
/** react-modal's content element, which carries F36's `topOffset` as an inline `top`. */
const placed = () => box()?.parentElement as HTMLElement;

const Example = ({ isShown }: { isShown: boolean }) => (
  <FieldModal isShown={isShown} onClose={vi.fn()} size="large">
    {() => (
      <>
        <Modal.Header title="Example" />
        <Modal.Content>Body</Modal.Content>
      </>
    )}
  </FieldModal>
);

describe('FieldModal', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        const element = this as HTMLElement;
        if (!element.hasAttribute('data-modal-root')) return 0;
        return element.textContent?.includes('Short') ? SHORT_MODAL_HEIGHT : MODAL_HEIGHT;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    }
    document.body.style.minHeight = '';
  });

  it('opens at the top of the part of the iframe that is on screen', async () => {
    installObserver({ top: 300, height: 500 });
    render(<Example isShown />);

    await screen.findByText('Body');
    // F36 adds its own 48px overlay padding to this, so the box sits just inside the visible part.
    expect(placed()).toHaveStyle({ top: '300px' });
  });

  it('holds the document tall enough for the whole modal, so it is never squeezed', async () => {
    installObserver({ top: 300, height: 500 });
    render(<Example isShown />);

    await screen.findByText('Body');
    // Visible top + overlay padding + the modal's own height + overlay padding.
    await waitFor(() =>
      expect(document.body.style.minHeight).toBe(`${300 + 48 + MODAL_HEIGHT + 48}px`)
    );
    // Its natural height, not F36's `100vh - 100px` cap, since the document makes the room.
    expect(box()).toHaveStyle({ maxHeight: 'none' });
  });

  it('lets the iframe shrink back once the modal has closed', async () => {
    installObserver({ top: 0, height: 500 });
    const { rerender } = render(<Example isShown />);
    await waitFor(() => expect(document.body.style.minHeight).not.toBe(''));

    rerender(<Example isShown={false} />);

    // After F36's close animation, which is what the modal is still drawn through.
    await waitFor(() => expect(document.body.style.minHeight).toBe(''), { timeout: 1000 });
  });

  it('measures again on every open, since the editor may have scrolled in between', async () => {
    const observe = installObserver({ top: 120, height: 500 });
    const { rerender } = render(<Example isShown />);
    await screen.findByText('Body');
    rerender(<Example isShown={false} />);
    await waitFor(() => expect(box()).toBeNull(), { timeout: 1000 });

    rerender(<Example isShown />);
    await screen.findByText('Body');
    expect(observe).toHaveBeenCalledTimes(2);
  });

  it('holds the taller requirement while two are open, and the other once one closes', async () => {
    installObserver({ top: 0, height: 500 });
    const both = (isFirstShown: boolean) => (
      <>
        <Example isShown={isFirstShown} />
        <FieldModal isShown onClose={vi.fn()}>
          {() => <Modal.Content>Short</Modal.Content>}
        </FieldModal>
      </>
    );
    const { rerender } = render(both(true));
    await screen.findByText('Short');
    await screen.findByText('Body');
    await waitFor(() => expect(document.body.style.minHeight).toBe(`${48 + MODAL_HEIGHT + 48}px`));

    rerender(both(false));

    await waitFor(
      () => expect(document.body.style.minHeight).toBe(`${48 + SHORT_MODAL_HEIGHT + 48}px`),
      { timeout: 1000 }
    );
  });

  it('opens as a plain F36 modal when nothing answers', async () => {
    // A page that is not being rendered delivers no observer callbacks at all.
    vi.useFakeTimers();
    installObserver(undefined);
    render(<Example isShown />);

    expect(screen.queryByText('Body')).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(placed()).toHaveStyle({ top: '0px' });
    expect(document.body.style.minHeight).toBe('');
  });

  it('opens as a plain F36 modal when the iframe is not on screen at all', async () => {
    installObserver({ top: 0, height: 0 });
    render(<Example isShown />);

    await screen.findByText('Body');
    expect(document.body.style.minHeight).toBe('');
  });

  it('opens straight away, as F36 would, where there is no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Example isShown />);

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(document.body.style.minHeight).toBe('');
  });

  it('fits a modal written with plain children too', async () => {
    installObserver({ top: 50, height: 500 });
    render(
      <FieldModal isShown onClose={vi.fn()}>
        <Modal.Header title="Plain" />
        <Modal.Content>Plain body</Modal.Content>
      </FieldModal>
    );

    await screen.findByText('Plain body');
    expect(placed()).toHaveStyle({ top: '50px' });
    await waitFor(() =>
      expect(document.body.style.minHeight).toBe(`${50 + 48 + MODAL_HEIGHT + 48}px`)
    );
  });
});

/** Every modal the field location opens goes through it — a plain F36 `Modal` would pass the rest. */
describe('the modals that use it', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.style.minHeight = '';
  });

  const sdk = {
    locales: { default: 'en-US' },
    contentType: { fields: [{ id: 'title', name: 'Title' }] },
    entry: {
      fields: {
        title: {
          id: 'title',
          type: 'Symbol',
          locales: ['en-US'],
          getValue: () => undefined,
          onValueChanged: () => () => undefined,
        },
      },
      getSys: () => ({ id: 'entry-1' }),
    },
    field: { id: 'muxVideo' },
  } as never;

  it.each([
    [
      'the run form',
      () => (
        <RobotsRunModal
          isShown
          onClose={vi.fn()}
          onRun={vi.fn(async () => undefined)}
          assetId="asset-1"
          captions={[]}
          audioTracks={[]}
          isRunDisabled={false}
        />
      ),
    ],
    [
      'the output viewer',
      () => (
        <RobotsOutputViewer
          job={{ id: 'rjob_1', workflow: 'summarize', status: 'completed', outputs: {} }}
          onClose={vi.fn()}
        />
      ),
    ],
    [
      'the apply-summary dialog',
      () => (
        <ApplyToEntryModal
          isShown
          onClose={vi.fn()}
          sdk={sdk}
          outputs={{ summarize: { jobId: 'rjob_1', title: 'A title' } }}
        />
      ),
    ],
    [
      'the upload modal',
      () => (
        <MuxAssetConfigurationModal
          isShown
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          installationParams={{ muxEnableSignedUrls: false }}
          sdk={sdk}
          canChooseDirectives
        />
      ),
    ],
  ])('%s opens where the editor is looking', async (_name, element) => {
    installObserver({ top: 240, height: 500 });
    render(element());

    await waitFor(() => expect(placed()).toHaveStyle({ top: '240px' }));
  });
});
