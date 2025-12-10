import { useState, useMemo } from 'react';
import { getOverlayProps, ModalType, OverlayProps } from '../utils/modalOverlayUtils';

interface ModalStates {
  isUploadModalOpen: boolean;
  isContentTypePickerOpen: boolean;
  isConfirmCancelModalOpen: boolean;
}

interface ModalSetters {
  setIsUploadModalOpen: (value: boolean) => void;
  setIsContentTypePickerOpen: (value: boolean) => void;
  setIsConfirmCancelModalOpen: (value: boolean) => void;
}

export const useModalManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);

  // Determine which modal is topmost (used to only show overlay on top modal)
  const topmostModal = useMemo(() => {
    if (isConfirmCancelModalOpen) return ModalType.CONFIRM_CANCEL;
    if (isContentTypePickerOpen) return ModalType.CONTENT_TYPE_PICKER;
    if (isUploadModalOpen) return ModalType.UPLOAD;
    return null;
  }, [isUploadModalOpen, isContentTypePickerOpen, isConfirmCancelModalOpen]);

  const getOverlayPropsForModal = (modalType: ModalType): OverlayProps | undefined => {
    return getOverlayProps(topmostModal === modalType);
  };

  const openModal = (modalType: ModalType) => {
    switch (modalType) {
      case ModalType.UPLOAD:
        setIsUploadModalOpen(true);
        break;
      case ModalType.CONTENT_TYPE_PICKER:
        setIsContentTypePickerOpen(true);
        break;
      case ModalType.CONFIRM_CANCEL:
        setIsConfirmCancelModalOpen(true);
        break;
    }
  };

  const closeModal = (modalType: ModalType) => {
    switch (modalType) {
      case ModalType.UPLOAD:
        setIsUploadModalOpen(false);
        break;
      case ModalType.CONTENT_TYPE_PICKER:
        setIsContentTypePickerOpen(false);
        break;
      case ModalType.CONFIRM_CANCEL:
        setIsConfirmCancelModalOpen(false);
        break;
    }
  };

  return {
    modalStates: {
      isUploadModalOpen,
      isContentTypePickerOpen,
      isConfirmCancelModalOpen,
    } as ModalStates,
    setModalStates: {
      setIsUploadModalOpen,
      setIsContentTypePickerOpen,
      setIsConfirmCancelModalOpen,
    } as ModalSetters,
    topmostModal,
    getOverlayPropsForModal,
    openModal,
    closeModal,
  };
};
