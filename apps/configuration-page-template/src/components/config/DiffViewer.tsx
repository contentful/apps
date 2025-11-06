import { FC } from 'react';
import { Modal, Button, Flex } from '@contentful/f36-components';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  oldCode: string;
  newCode: string;
  onAccept: () => void;
  onReject: () => void;
}

export const DiffViewer: FC<DiffViewerProps> = ({
  isOpen,
  onClose,
  oldCode,
  newCode,
  onAccept,
  onReject,
}) => {
  const handleAccept = () => {
    onAccept();
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  return (
    <Modal isShown={isOpen} onClose={onClose} size="fullWidth">
      {() => (
        <>
          <Modal.Header title="Code Changes" onClose={onClose} />
          <Modal.Content>
            <ReactDiffViewer
              oldValue={oldCode}
              newValue={newCode}
              splitView={true}
              showDiffOnly={false}
              useDarkTheme={true}
              styles={{
                variables: {
                  dark: {
                    diffViewerBackground: '#1e1e1e',
                    addedBackground: '#044B53',
                    addedColor: 'white',
                    removedBackground: '#632F34',
                    removedColor: 'white',
                    wordAddedBackground: '#055d67',
                    wordRemovedBackground: '#7d383f',
                    addedGutterBackground: '#034148',
                    removedGutterBackground: '#632b30',
                    gutterBackground: '#2c2c2c',
                    gutterBackgroundDark: '#262626',
                    highlightBackground: '#2a3f5f',
                    highlightGutterBackground: '#2d4566',
                  },
                },
              }}
            />
          </Modal.Content>
          <Modal.Controls>
            <Flex gap="spacingS" justifyContent="flex-end">
              <Button variant="secondary" onClick={handleReject}>
                Reject Changes
              </Button>
              <Button variant="positive" onClick={handleAccept}>
                Accept Changes
              </Button>
            </Flex>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
