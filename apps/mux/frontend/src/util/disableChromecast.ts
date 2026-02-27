// Prevent Chromecast/PresentationRequest errors in Contentful's sandboxed iframe
// The iframe lacks 'allow-presentation' flag which causes MuxPlayer's cast initialization to fail
// Remove the Presentation API entirely so cast_sender.js skips initialization

if (typeof window !== 'undefined' && window.self !== window.top) {
  // We're in an iframe - remove Presentation API so cast_sender.js detects it's unavailable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).PresentationRequest;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).PresentationConnection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).PresentationAvailability;

  // Remove navigator.presentation
  Object.defineProperty(navigator, 'presentation', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}
