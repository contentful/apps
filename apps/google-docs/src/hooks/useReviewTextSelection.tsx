import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { SelectionViewportRectangle } from '../locations/Page/components/review/mapping/selectionViewportRectangle';

const SEGMENT_SURFACE_SELECTOR = '[data-review-segment-surface]';
const SELECTION_MENU_HEADER_CLEARANCE_PX = 8;

function elementFromNode(node: Node): Element | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.parentElement;
  }
  return node instanceof Element ? node : null;
}

/**
 * Assign/Exclude applies only to document body (blocks/tables under each segment surface).
 * Excludes tab titles, mapping rail, and anything outside {@link SEGMENT_SURFACE_SELECTOR}.
 */
function isSelectionInDocumentBody(range: Range, root: HTMLElement): boolean {
  const endpointInSurface = (node: Node): boolean => {
    const el = elementFromNode(node);
    if (!el) return false;
    const surface = el.closest(SEGMENT_SURFACE_SELECTOR);
    return surface !== null && root.contains(surface);
  };

  return endpointInSurface(range.startContainer) && endpointInSurface(range.endContainer);
}

function intersectsViewport(
  rect: DOMRect | Pick<SelectionViewportRectangle, 'top' | 'left' | 'bottom' | 'right'>
): boolean {
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

export function getSelectionViewportRectangle(
  range: Range,
  root: HTMLElement,
  viewportTopInset = 0
): SelectionViewportRectangle | null {
  const rootRect = root.getBoundingClientRect();
  const clientRects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0
  );

  const visibleRects = clientRects
    .map((rect) => ({
      top: Math.max(rect.top, rootRect.top, viewportTopInset, 0),
      left: Math.max(rect.left, rootRect.left, 0),
      bottom: Math.min(rect.bottom, rootRect.bottom, window.innerHeight),
      right: Math.min(rect.right, rootRect.right, window.innerWidth),
    }))
    .filter((rect) => rect.bottom > rect.top && rect.right > rect.left)
    .filter(intersectsViewport)
    .sort((a, b) => {
      if (a.top !== b.top) return a.top - b.top;
      return a.left - b.left;
    });

  if (visibleRects.length > 0) {
    return visibleRects[0];
  }

  const boundingRect = range.getBoundingClientRect();
  if (
    !intersectsViewport(boundingRect) ||
    boundingRect.bottom <= Math.max(rootRect.top, viewportTopInset, 0)
  ) {
    return null;
  }

  return {
    top: boundingRect.top,
    left: boundingRect.left,
    bottom: boundingRect.bottom,
    right: boundingRect.right,
  };
}

function isValidReviewSelection(root: HTMLElement, sel: Selection): boolean {
  if (sel.rangeCount === 0 || sel.isCollapsed) {
    return false;
  }

  const range = sel.getRangeAt(0);
  const text = sel.toString();
  const rect = range.getBoundingClientRect();

  return (
    isSelectionInDocumentBody(range, root) &&
    text.trim().length > 0 &&
    (rect.width !== 0 || rect.height !== 0)
  );
}

export interface UseReviewTextSelectionResult {
  /** Derived from the visible selection rect for the floating menu. */
  selectionRectangle: SelectionViewportRectangle | null;
  selectedText: string;
  selectedRange: Range | null;
  clearSelection: () => void;
}

export function useReviewTextSelection(
  rootRef: RefObject<HTMLElement | null>,
  occludingTopRef?: RefObject<HTMLElement | null>
): UseReviewTextSelectionResult {
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  const updateFromSelection = useCallback(() => {
    const root = rootRef.current;
    const currentSelection = window.getSelection();
    if (!root || !currentSelection) {
      setSelectedText('');
      setSelectedRange(null);
      return;
    }

    if (isValidReviewSelection(root, currentSelection)) {
      setSelectedText(currentSelection.toString());
      setSelectedRange(currentSelection.getRangeAt(0).cloneRange());
      return;
    }

    setSelectedText('');
    setSelectedRange(null);
  }, [rootRef]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectedRange(null);
  }, []);

  const selectionRectangle =
    selectedRange && rootRef.current
      ? getSelectionViewportRectangle(
          selectedRange,
          rootRef.current,
          (occludingTopRef?.current?.getBoundingClientRect().bottom ?? 0) +
            SELECTION_MENU_HEADER_CLEARANCE_PX
        )
      : null;

  useEffect(() => {
    document.addEventListener('selectionchange', updateFromSelection);
    document.addEventListener('mouseup', updateFromSelection);
    window.addEventListener('scroll', updateFromSelection, { capture: true, passive: true });
    window.addEventListener('resize', updateFromSelection);

    return () => {
      document.removeEventListener('selectionchange', updateFromSelection);
      document.removeEventListener('mouseup', updateFromSelection);
      window.removeEventListener('scroll', updateFromSelection, { capture: true });
      window.removeEventListener('resize', updateFromSelection);
    };
  }, [rootRef, updateFromSelection]);

  return { selectionRectangle, selectedText, selectedRange, clearSelection };
}
