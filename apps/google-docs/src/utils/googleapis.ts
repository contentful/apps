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
    script.onload = () => {
      (window as any).gapi.load('client:auth2', () => resolve());
    };
    script.onerror = () => reject(new Error('Failed to load gapi'));
    document.body.appendChild(script);
  });
  return gapiLoaded;
}

export function loadPickerApi(): Promise<void> {
  if (pickerLoaded) return pickerLoaded;
  pickerLoaded = new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.picker) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js?onload=__pickerOnLoad';
    script.async = true;

    (window as any).__pickerOnLoad = () => {
      (window as any).gapi.load('picker', () => resolve());
    };

    script.onerror = () => reject(new Error('Failed to load Google Picker'));
    document.body.appendChild(script);
  });
  return pickerLoaded;
}
