import { useState } from 'react';

export enum ModalType {
  UPLOAD = 'upload',
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  CONFIRM_CANCEL = 'confirmCancel',
  ERROR_PREVIEW = 'errorPreview',
  SELECT_TABS = 'selectTabs',
}

export const useModalManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);
  const [isErrorPreviewModalOpen, setIsErrorPreviewModalOpen] = useState<boolean>(false);
  const [isSelectTabsModalOpen, setIsSelectTabsModalOpen] = useState<boolean>(false);

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
      case ModalType.ERROR_PREVIEW:
        setIsErrorPreviewModalOpen(true);
        break;
      case ModalType.SELECT_TABS:
        setIsSelectTabsModalOpen(true);
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
      case ModalType.ERROR_PREVIEW:
        setIsErrorPreviewModalOpen(false);
        break;
      case ModalType.SELECT_TABS:
        setIsSelectTabsModalOpen(false);
        break;
    }
  };

  return {
    modalStates: {
      isUploadModalOpen,
      isContentTypePickerOpen,
      isConfirmCancelModalOpen,
      isErrorPreviewModalOpen,
      isSelectTabsModalOpen,
    },
    openModal,
    closeModal,
  };
};
