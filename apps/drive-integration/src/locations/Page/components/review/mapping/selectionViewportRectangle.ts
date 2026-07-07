/**
 * Viewport rectangle for a text selection, used to anchor the review action menu.
 * Kept separate from UI components so hooks do not depend on feature components.
 */
export interface SelectionViewportRectangle {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
