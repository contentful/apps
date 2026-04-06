export const DIALOG_MIN_HEIGHT = '80vh';

export function createDialogOptions(title, parameters) {
  return {
    position: 'center',
    title,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters,
    width: 'fullWidth',
    minHeight: DIALOG_MIN_HEIGHT,
    allowHeightOverflow: true,
  };
}

export function applyDialogSizing(container, iframe) {
  container.style.width = '100%';
  container.style.height = DIALOG_MIN_HEIGHT;

  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.display = 'block';
  iframe.style.border = 'none';
}
