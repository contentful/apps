// hooks/useGoogleDocsPicker.ts
import { useCallback, useState } from 'react';
import { loadGapi, loadPickerApi } from './googleapis';

type PickerCallbackData = {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
};

type UseGoogleDocsPickerOptions = {
  onPicked?: (files: PickerCallbackData[]) => void;
};

export function useGoogleDocsPicker(
  accessToken: string | null,
  options: UseGoogleDocsPickerOptions = {}
) {
  const [isOpening, setIsOpening] = useState(false);

  const openPicker = useCallback(async () => {
    if (!accessToken) {
      console.warn('No Google access token available');
      return;
    }

    try {
      setIsOpening(true);
      await loadGapi();
      await loadPickerApi();

      const google = (window as any).google;
      const gapi = (window as any).gapi;

      const view = new google.picker.View(google.picker.ViewId.DOCS);
      view.setMimeTypes('application/vnd.google-apps.document'); // only Google Docs

      const picker = new google.picker.PickerBuilder()
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_PICKER_API_KEY)
        .addView(view)
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setOrigin('https://app.contentful.com') // ✅ ALWAYS THIS VALUE
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const docs: PickerCallbackData[] = data.docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url,
            }));
            options.onPicked?.(docs);
          }
        });

      if (GOOGLE_APP_ID) {
        picker.setAppId(GOOGLE_APP_ID);
      }

      picker.build().setVisible(true);
    } catch (e) {
      console.error('Error opening Google Docs picker', e);
    } finally {
      setIsOpening(false);
    }
  }, [accessToken, options.onPicked]);

  return { openPicker, isOpening };
}
