import { FC, useState } from 'react';
import { Modal, Button, Radio, Stack, FormControl, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export interface ModalData {
  videoQuality: string;
}

type ModalProps = {
  isShown: boolean;
  onClose: () => void;
  onConfirm: (options: ModalData) => void;
};

const options: Record<string,string> = {
  basic: 'Lower video quality with no encoding cost. Ideal for simple video needs. ',
  plus: 'High-quality video with smart encoding that adapts to content complexity. ',
  premium: 'Top-tier quality for high-end content like live sports or movies. ',
};

const ModalUploadAsset: FC<ModalProps> = ({isShown = false, onClose, onConfirm}) => {
  const [videoQuality, setVideoQuality] = useState('plus');

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
              {Object.entries(options).map(([id]) => (
                <Radio
                  key={id}
                  id={`radio${id}`}
                  name="radio-controlled"
                  value={id}
                  isChecked={videoQuality === id}
                  onChange={() => setVideoQuality(id)}
                >
                  {String(id[0]).toUpperCase() + String(id).slice(1)}
                </Radio>
              ))}
            </Stack>
            <FormControl.HelpText>
              {options[videoQuality]}
              <TextLink
                icon={<ExternalLinkIcon />}
                alignIcon="end"
                href="https://www.mux.com/docs/guides/use-video-quality-levels#introducing-video-quality-levels"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </TextLink>
            </FormControl.HelpText>
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