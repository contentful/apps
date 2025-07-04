import React, { useRef } from 'react';
import { Box, Button } from '@contentful/f36-components';
import MuxUploader from '@mux/mux-uploader-react';
import styles from './UploadArea.module.css';

interface UploadAreaProps {
  showMuxUploaderUI: boolean;
  muxUploaderRef: React.RefObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  onSuccess: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  showMuxUploaderUI,
  muxUploaderRef,
  onSuccess,
  onDrop,
  onFileChange,
  fileInputRef,
}) => {
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = fileInputRef || internalFileInputRef;

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <Box marginBottom="spacingM">
      <div
        id="uploaderDropzone"
        className={styles.dropzone}
        style={{ display: showMuxUploaderUI ? 'none' : 'flex' }}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}>
        <h2 className={styles.title}>Drop a video file here to upload</h2>
        <span className={styles.or}>or</span>
        <Button
          variant="secondary"
          size="large"
          className={styles.uploadButton}
          onClick={handleButtonClick}>
          Upload a video
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>
      <MuxUploader
        id="muxuploader"
        ref={muxUploaderRef}
        type="bar"
        onSuccess={onSuccess}
        noDrop
        className={styles.muxUploaderContainer}
        style={
          {
            '--uploader-background-color': 'rgb(247, 249, 250)',
            '--button-border-radius': '4px',
            '--button-border': '1px solid rgb(207, 217, 224)',
            '--button-padding': '0.5rem 1rem',
            display: showMuxUploaderUI ? 'flex' : 'none',
          } as React.CSSProperties
        }
      />
    </Box>
  );
};

export default UploadArea;
