import { FC, useCallback, useEffect, useState } from 'react';
import { Modal, ModalProps } from '@contentful/f36-components';

/**
 * An F36 `Modal` for the field location, where the viewport is the field's own iframe.
 *
 * F36 centres a modal in the viewport and caps it at `100vh - 100px`. Here the viewport is an
 * iframe the SDK's auto-resizer keeps exactly as tall as its content, and the modal's fixed
 * overlay does not count towards that. So a modal opened from a short tab was squeezed into a
 * scroll box, and one opened from a tall tab was centred in an iframe taller than the window —
 * often below the part the editor could see, confirm button and all.
 *
 * So it opens at the top of the part of the iframe that is on screen, which an
 * IntersectionObserver reports even across the frame boundary, at its full height, and holds the
 * document tall enough to contain it until it has closed.
 *
 * Where that cannot be measured — no IntersectionObserver, or no answer within a moment because
 * the tab is not being rendered — it behaves exactly like F36's `Modal`.
 */

/** F36's overlay padding (`spacing2Xl`): what `topOffset` is added to, above and below. */
const OVERLAY_PADDING = 48;
/** An observer answers on the next frame; one that has not by now is not being rendered. */
const MEASURE_TIMEOUT_MS = 150;

const canMeasure = () => typeof IntersectionObserver !== 'undefined';

/** The top of the visible part of this document, in its own coordinates, if it can be told. */
function measureVisibleTop(): Promise<number | undefined> {
  return new Promise((resolve) => {
    let isDone = false;
    const observer = new IntersectionObserver((entries) => {
      const rect = entries[0]?.intersectionRect;
      finish(rect && rect.height > 0 ? rect.top : undefined);
    });
    const timer = setTimeout(() => finish(undefined), MEASURE_TIMEOUT_MS);
    function finish(top: number | undefined) {
      if (isDone) return;
      isDone = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(top);
    }
    observer.observe(document.documentElement);
  });
}

/**
 * What each open modal needs the document to be, so two cannot fight over one `min-height`. On
 * `body` because that is what the auto-resizer observes.
 */
const requiredHeights = new Map<symbol, number>();

function applyRequiredHeight() {
  const tallest = Math.max(0, ...Array.from(requiredHeights.values()));
  document.body.style.minHeight = tallest > 0 ? `${Math.ceil(tallest)}px` : '';
}

const FieldModal: FC<ModalProps> = ({ isShown, children, ...props }) => {
  /** Not measured yet; `null` when it could not be; otherwise the visible top. */
  const [visibleTop, setVisibleTop] = useState<number | null | undefined>();
  const [box, setBox] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isShown || visibleTop !== undefined || !canMeasure()) return;
    let isCancelled = false;
    measureVisibleTop().then((top) => {
      if (!isCancelled) setVisibleTop(top ?? null);
    });
    return () => {
      isCancelled = true;
    };
  }, [isShown, visibleTop]);

  // Called with the modal's own box when its content mounts, and with nothing once it has
  // unmounted — after the close animation, which is why the placement is only forgotten here.
  const sentinelRef = useCallback((node: HTMLSpanElement | null) => {
    setBox((node?.closest('[data-modal-root]') as HTMLElement | null) ?? null);
    if (!node) setVisibleTop(undefined);
  }, []);

  useEffect(() => {
    if (!box || typeof visibleTop !== 'number') return;
    const key = Symbol('field-modal');
    const update = () => {
      requiredHeights.set(key, visibleTop + OVERLAY_PADDING + box.offsetHeight + OVERLAY_PADDING);
      applyRequiredHeight();
    };
    const observer = new ResizeObserver(update);
    observer.observe(box);
    update();
    return () => {
      observer.disconnect();
      requiredHeights.delete(key);
      applyRequiredHeight();
    };
  }, [box, visibleTop]);

  const isPlaced = typeof visibleTop === 'number';
  const sentinel = <span ref={sentinelRef} hidden />;

  return (
    <Modal
      {...props}
      // Held back for the frame the measurement takes, so it never opens in one place and jumps.
      isShown={isShown && (visibleTop !== undefined || !canMeasure())}
      position={isPlaced ? 'top' : props.position}
      topOffset={isPlaced ? visibleTop : props.topOffset}
      // Its natural height, since the document grows to make room for it.
      allowHeightOverflow={isPlaced || props.allowHeightOverflow}>
      {typeof children === 'function' ? (
        (modalProps: ModalProps) => (
          <>
            {sentinel}
            {children(modalProps)}
          </>
        )
      ) : (
        <>
          {sentinel}
          {children}
        </>
      )}
    </Modal>
  );
};

export default FieldModal;
