import { FC, useState } from 'react';
import { Modal, Button, Radio, Stack, FormControl } from '@contentful/f36-components';

export interface ModalData {
  videoQuality: string;
}

type ModalProps = {
  isShown: boolean;
  onClose: () => void;
  onConfirm: (options: ModalData) => void;
};

const ModalUploadAsset: FC<ModalProps> = ({isShown = false, onClose, onConfirm}) => {
  const [videoQuality, setVideoQuality] = useState('basic');

  return (
    <>
      <Modal
        isShown={isShown}
        onClose={onClose}
      >
        <Modal.Header 
          title='Configure Mux Upload'
          onClose={onClose}
        />
        <Modal.Content>
          <FormControl>
            <FormControl.Label>Video Quality</FormControl.Label>
            <Stack flexDirection="row">
              <Radio
                id="radioBasic"
                name="radio-controlled"
                value="basic"
                isChecked={videoQuality === 'basic'}
                onChange={() => setVideoQuality('basic')}
              >
                Basic
              </Radio>
              <Radio
                id="radioPlus"
                name="radio-controlled"
                value="plus"
                isChecked={videoQuality === 'plus'}
                onChange={() => setVideoQuality('plus')}
              >
                Plus
              </Radio>
              <Radio
                id="radioPremium"
                name="radio-controlled"
                value="basic"
                isChecked={videoQuality === 'premium'}
                onChange={() => setVideoQuality('premium')}
              >
                Premium
              </Radio>
            </Stack>
          </FormControl>
        </Modal.Content>

        <Modal.Controls>
          <Button
            size="small"
            variant="transparent"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="positive"
            onClick={() => onConfirm({videoQuality})}
          >
            Upload
          </Button>
        </Modal.Controls>
      </Modal>
    </>
  );
}

export default ModalUploadAsset;