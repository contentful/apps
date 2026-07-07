import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { SelectionViewportRectangle } from '../locations/Page/components/review/mapping/selectionViewportRectangle';

const SEGMENT_SURFACE_SELECTOR = '[data-review-segment-surface]';

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

function getSelectionViewportRectangle(range: Range): SelectionViewportRectangle {
  const rect = range.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
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
  /** Derived from {@link selectedRange} via `getBoundingClientRect()` for the floating menu. */
  selectionRectangle: SelectionViewportRectangle | null;
  selectedText: string;
  selectedRange: Range | null;
  clearSelection: () => void;
}

export function useReviewTextSelection(
  rootRef: RefObject<HTMLElement | null>
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

  const selectionRectangle = selectedRange ? getSelectionViewportRectangle(selectedRange) : null;

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
