import { useEffect, useRef } from 'react';
import { useGoogleDocsPicker } from '../../../../../hooks/useGoogleDocPicker';

interface SelectDocumentModalProps {
  oauthToken: string;
  isOpen: boolean;
  onClose: (documentId?: string) => void;
}

export default function SelectDocumentModal({
  oauthToken,
  isOpen,
  onClose,
}: SelectDocumentModalProps) {
  const hasOpenedPickerRef = useRef(false);

  const { openPicker } = useGoogleDocsPicker(oauthToken, {
    onPicked: (files) => {
      if (files.length > 0) {
        onClose(files[0].id);
      } else {
        onClose();
      }
      hasOpenedPickerRef.current = false;
    },
  });

  useEffect(() => {
    if (isOpen && oauthToken && !hasOpenedPickerRef.current) {
      hasOpenedPickerRef.current = true;
      openPicker();
    }

    if (!isOpen) {
      hasOpenedPickerRef.current = false;
    }
  }, [isOpen, oauthToken, openPicker]);

  // This component no longer renders a modal since the Google Picker
  // opens as a separate popup. Return null as there's nothing to render.
  return null;
}
