// components/GoogleDocsPickerButton.tsx
import React from 'react';
import { useGoogleDocsPicker } from './useGoogleDocPicker';

type Props = {
  accessToken: string | null; // from your auth integration
  onDocSelected: (doc: { id: string; name: string; mimeType: string; url?: string }) => void;
};

export const GoogleDocsPickerButton: React.FC<Props> = ({ accessToken, onDocSelected }) => {
  console.log('accessToken', accessToken);
  const { openPicker, isOpening } = useGoogleDocsPicker(accessToken, {
    onPicked: (files: any) => {
      // For your use case, maybe enforce single selection
      if (files.length > 0) {
        onDocSelected(files[0]);
      }
    },
  });

  return (
    <button type="button" onClick={openPicker} disabled={!accessToken}>
      {isOpening ? 'Opening Google Docs…' : 'Choose a Google Doc'}
    </button>
  );
};
