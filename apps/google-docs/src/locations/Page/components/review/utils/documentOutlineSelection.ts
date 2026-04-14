export function getNodeOffsetWithinElement(
  element: HTMLElement,
  container: Node,
  offset: number
): number | null {
  const range = document.createRange();

  try {
    range.selectNodeContents(element);
    range.setEnd(container, offset);
  } catch {
    return null;
  }

  return range.toString().length;
}

export function isSelectionInsideElement(range: Range, element: HTMLElement): boolean {
  return element.contains(range.startContainer) && element.contains(range.endContainer);
}
