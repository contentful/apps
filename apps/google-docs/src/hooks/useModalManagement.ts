import { useState } from 'react';

interface ModalStates {
  isUploadModalOpen: boolean;
  isContentTypePickerOpen: boolean;
  isConfirmCancelModalOpen: boolean;
  isPreviewModalOpen: boolean;
  isReviewModalOpen: boolean;
  isErrorEntriesModalOpen: boolean;
  isLoadingModalOpen: boolean;
}

interface ModalSetters {
  setIsUploadModalOpen: (value: boolean) => void;
  setIsContentTypePickerOpen: (value: boolean) => void;
  setIsConfirmCancelModalOpen: (value: boolean) => void;
  setIsPreviewModalOpen: (value: boolean) => void;
  setIsReviewModalOpen: (value: boolean) => void;
  setIsErrorEntriesModalOpen: (value: boolean) => void;
  setIsLoadingModalOpen: (value: boolean) => void;
}

export enum ModalType {
  UPLOAD = 'upload',
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  CONFIRM_CANCEL = 'confirmCancel',
  PREVIEW = 'preview',
  REVIEW = 'review',
  ERROR_ENTRIES = 'errorEntries',
  LOADING = 'loading',
}

export const useModalManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isErrorEntriesModalOpen, setIsErrorEntriesModalOpen] = useState<boolean>(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState<boolean>(false);

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
      case ModalType.ERROR_ENTRIES:
        setIsErrorEntriesModalOpen(true);
        break;
      case ModalType.LOADING:
        setIsLoadingModalOpen(true);
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
      case ModalType.ERROR_ENTRIES:
        setIsErrorEntriesModalOpen(false);
        break;
      case ModalType.LOADING:
        setIsLoadingModalOpen(false);
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
      isErrorEntriesModalOpen,
      isLoadingModalOpen,
    } as ModalStates,
    setModalStates: {
      setIsUploadModalOpen,
      setIsContentTypePickerOpen,
      setIsConfirmCancelModalOpen,
      setIsPreviewModalOpen,
      setIsReviewModalOpen,
      setIsErrorEntriesModalOpen,
      setIsLoadingModalOpen,
    } as ModalSetters,
    openModal,
    closeModal,
  };
};
