import { useState } from 'react';

interface ModalStates {
  isUploadModalOpen: boolean;
  isContentTypePickerOpen: boolean;
  isConfirmCancelModalOpen: boolean;
  isPreviewModalOpen: boolean;
  isReviewModalOpen: boolean;
}

interface ModalSetters {
  setIsUploadModalOpen: (value: boolean) => void;
  setIsContentTypePickerOpen: (value: boolean) => void;
  setIsConfirmCancelModalOpen: (value: boolean) => void;
  setIsPreviewModalOpen: (value: boolean) => void;
  setIsReviewModalOpen: (value: boolean) => void;
}

export enum ModalType {
  UPLOAD = 'upload',
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  CONFIRM_CANCEL = 'confirmCancel',
  PREVIEW = 'preview',
  REVIEW = 'review',
}

export const useModalManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

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
      case ModalType.PREVIEW:
        setIsPreviewModalOpen(true);
        break;
      case ModalType.REVIEW:
        setIsReviewModalOpen(true);
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
      case ModalType.PREVIEW:
        setIsPreviewModalOpen(false);
        break;
      case ModalType.REVIEW:
        setIsReviewModalOpen(false);
        break;
    }
  };

  return {
    modalStates: {
      isUploadModalOpen,
      isContentTypePickerOpen,
      isConfirmCancelModalOpen,
      isPreviewModalOpen,
      isReviewModalOpen,
    } as ModalStates,
    setModalStates: {
      setIsUploadModalOpen,
      setIsContentTypePickerOpen,
      setIsConfirmCancelModalOpen,
      setIsPreviewModalOpen,
      setIsReviewModalOpen,
    } as ModalSetters,
    openModal,
    closeModal,
  };
};
