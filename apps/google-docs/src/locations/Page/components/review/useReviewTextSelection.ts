import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { SelectionActionMenuAnchorRect } from './SelectionActionMenu';

const SEGMENT_SURFACE_SELECTOR = '[data-review-segment-surface]';

function isSelectionInsideRoot(root: HTMLElement, node: Node | null | undefined): boolean {
  if (!node) return false;
  if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
    return root.contains(node.parentElement);
  }
  if (node instanceof Element) {
    return root.contains(node);
  }
  return false;
}

function elementFromNode(node: Node | null): Element | null {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) {
    return node.parentElement;
  }
  return node instanceof Element ? node : null;
}

/**
 * Assign/Exclude applies only to document body (blocks/tables under each segment surface).
 * Excludes tab titles, mapping rail, and anything outside {@link SEGMENT_SURFACE_SELECTOR}.
 */
function isSelectionFullyInSegmentSurface(range: Range, root: HTMLElement): boolean {
  const endpointInSurface = (node: Node): boolean => {
    const el = elementFromNode(node);
    if (!el) return false;
    const surface = el.closest(SEGMENT_SURFACE_SELECTOR);
    return surface !== null && root.contains(surface);
  };

  return endpointInSurface(range.startContainer) && endpointInSurface(range.endContainer);
}

function getSelectionToolbarAnchor(
  root: HTMLElement,
  sel: Selection
): SelectionActionMenuAnchorRect | null {
  if (sel.rangeCount === 0 || sel.isCollapsed) {
    return null;
  }

  const range = sel.getRangeAt(0);
  const text = sel.toString();
  const rect = range.getBoundingClientRect();

  const isValid =
    isSelectionInsideRoot(root, range.commonAncestorContainer) &&
    isSelectionFullyInSegmentSurface(range, root) &&
    text.trim().length > 0 &&
    (rect.width !== 0 || rect.height !== 0);

  if (!isValid) {
    return null;
  }

  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
  };
}

export interface UseReviewTextSelectionResult {
  anchorRect: SelectionActionMenuAnchorRect | null;
  clearSelection: () => void;
}

export function useReviewTextSelection(
  rootRef: RefObject<HTMLElement | null>
): UseReviewTextSelectionResult {
  const [anchorRect, setAnchorRect] = useState<SelectionActionMenuAnchorRect | null>(null);

  const updateFromSelection = useCallback(() => {
    const root = rootRef.current;
    const sel = window.getSelection();
    if (!root || !sel) {
      setAnchorRect(null);
      return;
    }

    setAnchorRect(getSelectionToolbarAnchor(root, sel));
  }, [rootRef]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setAnchorRect(null);
  }, []);

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

  return { anchorRect, clearSelection };
}
