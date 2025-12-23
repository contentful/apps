import { useEffect, useRef, useCallback } from 'react';
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
  const onCloseRef = useRef(onClose);

  // Keep onClose ref updated
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Stable callbacks that use refs
  const handlePicked = useCallback((files: { id: string }[]) => {
    if (files.length > 0) {
      onCloseRef.current(files[0].id);
    } else {
      onCloseRef.current();
    }
    hasOpenedPickerRef.current = false;
  }, []);

  const handleCancel = useCallback(() => {
    onCloseRef.current();
    hasOpenedPickerRef.current = false;
  }, []);

  const { openPicker } = useGoogleDocsPicker(oauthToken, {
    onPicked: handlePicked,
    onCancel: handleCancel,
  });

  // Store openPicker in a ref so the effect doesn't re-run when it changes
  const openPickerRef = useRef(openPicker);
  useEffect(() => {
    openPickerRef.current = openPicker;
  }, [openPicker]);

  useEffect(() => {
    if (isOpen && oauthToken && !hasOpenedPickerRef.current) {
      hasOpenedPickerRef.current = true;
      openPickerRef.current();
    }

    if (!isOpen) {
      hasOpenedPickerRef.current = false;
    }
  }, [isOpen, oauthToken]);

  // This component no longer renders a modal since the Google Picker
  // opens as a separate popup. Return null as there's nothing to render.
  return null;
}
