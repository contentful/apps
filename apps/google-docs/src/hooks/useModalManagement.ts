import { useState } from 'react';

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

export enum ModalType {
  UPLOAD = 'upload',
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  CONFIRM_CANCEL = 'confirmCancel',
}

export const useModalManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);

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
    openModal,
    closeModal,
  };
};
