import { useCallback, useState } from 'react';
import { loadGapi, loadPickerApi } from '../utils/googleapis';

type PickerCallbackData = {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
};

type UseGoogleDocsPickerOptions = {
  onPicked?: (files: PickerCallbackData[]) => void;
  onCancel?: () => void;
};

// These are already exposed by google in the network even if they were hidden as environment variables
// and google acknowledges that these are okay to be public and that restrictions come from defining the
// origin web url that is allowed to use these keys which is defined in a private google docs oauth app.
// Additionally the api key requires a valid OAuth token for operations on private user data.
// That means even if someone sees your key, they cannot:
// 1. access user files without an OAuth token,
// 2. use other APIs you haven’t enabled,

// Summary: The API keys are defined to only only accept requests from app.contentful.com and ctfapps.net domains.
// See https://developers.google.com/workspace/drive/picker/guides/overview?utm_source=chatgpt.com#create-api-key for more details
const GOOGLE_PICKER_API_KEY = '';
const GOOGLE_APP_ID = 1;

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

      // Only show Google Docs
      const view = new google.picker.View(google.picker.ViewId.DOCS);
      view.setMimeTypes('application/vnd.google-apps.document');

      const picker = new google.picker.PickerBuilder()
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_PICKER_API_KEY)
        .addView(view)
        .setOrigin('https://app.contentful.com')
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const docs: PickerCallbackData[] = data.docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url,
            }));
            options.onPicked?.(docs);
          } else if (data.action === google.picker.Action.CANCEL) {
            options.onCancel?.();
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
  }, [accessToken, options.onPicked, options.onCancel]);

  return { openPicker, isOpening };
}
