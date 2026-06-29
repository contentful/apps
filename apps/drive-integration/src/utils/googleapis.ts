let gapiLoaded: Promise<void> | null = null;
let pickerLoaded: Promise<void> | null = null;

export function loadGapi(): Promise<void> {
  if (gapiLoaded) return gapiLoaded;
  gapiLoaded = new Promise((resolve, reject) => {
    if ((window as any).gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load gapi'));
    document.body.appendChild(script);
  });
  return gapiLoaded;
}

export function loadPickerApi(): Promise<void> {
  if (pickerLoaded) return pickerLoaded;
  pickerLoaded = loadGapi().then(
    () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).google?.picker) {
          resolve();
          return;
        }
        (window as any).gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Failed to load picker API')),
        });
      })
  );
  return pickerLoaded;
}
