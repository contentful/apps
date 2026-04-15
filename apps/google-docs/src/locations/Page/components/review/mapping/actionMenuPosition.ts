/**
 * Viewport rectangle for positioning the review text selection action menu.
 * Kept separate from UI components so hooks do not depend on feature components.
 */
export interface ActionMenuPosition {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
