import { useState } from 'react';

interface ModalStates {
  isUploadModalOpen: boolean;
  isContentTypePickerOpen: boolean;
  isConfirmCancelModalOpen: boolean;
  isPreviewModalOpen: boolean;
  isErrorPreviewModalOpen: boolean;
  isReviewModalOpen: boolean;
  isErrorEntriesModalOpen: boolean;
}

interface ModalSetters {
  setIsUploadModalOpen: (value: boolean) => void;
  setIsContentTypePickerOpen: (value: boolean) => void;
  setIsConfirmCancelModalOpen: (value: boolean) => void;
  setIsPreviewModalOpen: (value: boolean) => void;
  setIsErrorPreviewModalOpen: (value: boolean) => void;
  setIsReviewModalOpen: (value: boolean) => void;
  setIsErrorEntriesModalOpen: (value: boolean) => void;
}

export enum ModalType {
  UPLOAD = 'upload',
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  CONFIRM_CANCEL = 'confirmCancel',
  PREVIEW = 'preview',
  ERROR_PREVIEW = 'errorPreview',
  REVIEW = 'review',
  ERROR_ENTRIES = 'errorEntries',
}

export const useModalManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isErrorPreviewModalOpen, setIsErrorPreviewModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isErrorEntriesModalOpen, setIsErrorEntriesModalOpen] = useState<boolean>(false);

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
      case ModalType.ERROR_PREVIEW:
        setIsErrorPreviewModalOpen(true);
        break;
      case ModalType.REVIEW:
        setIsReviewModalOpen(true);
        break;
      case ModalType.ERROR_ENTRIES:
        setIsErrorEntriesModalOpen(true);
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
      case ModalType.ERROR_PREVIEW:
        setIsErrorPreviewModalOpen(false);
        break;
      case ModalType.REVIEW:
        setIsReviewModalOpen(false);
        break;
      case ModalType.ERROR_ENTRIES:
        setIsErrorEntriesModalOpen(false);
        break;
    }
  };

  return {
    modalStates: {
      isUploadModalOpen,
      isContentTypePickerOpen,
      isConfirmCancelModalOpen,
      isPreviewModalOpen,
      isErrorPreviewModalOpen,
      isReviewModalOpen,
      isErrorEntriesModalOpen,
    } as ModalStates,
    setModalStates: {
      setIsUploadModalOpen,
      setIsContentTypePickerOpen,
      setIsConfirmCancelModalOpen,
      setIsPreviewModalOpen,
      setIsErrorPreviewModalOpen,
      setIsReviewModalOpen,
      setIsErrorEntriesModalOpen,
    } as ModalSetters,
    openModal,
    closeModal,
  };
};
