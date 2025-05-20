import { FC, useState } from 'react';
import { Modal, Button, Accordion } from '@contentful/f36-components';
import { InstallationParams } from '../../util/types';
import { VideoQualitySelector } from './VideoQualitySelector';
import { PlaybackPolicySelector } from './PlaybackPolicySelector';
import CaptionsConfiguration, { CaptionsConfig } from './CaptionsConfiguration';

export interface ModalData {
  videoQuality: string;
  playbackPolicies: string[];
  captionsConfig: CaptionsConfig;
}

type ModalProps = {
  isShown: boolean;
  onClose: () => void;
  onConfirm: (options: ModalData) => void;
  installationParams: InstallationParams;
};

const ModalContent: FC<ModalProps> = ({
  isShown = false,
  onClose,
  onConfirm,
  installationParams,
}) => {
  const [videoQuality, setVideoQuality] = useState('plus');
  const [playbackPolicies, setPlaybackPolicies] = useState<string[]>(['public']);
  const [captionsConfig, setCaptionsConfig] = useState<CaptionsConfig>({
    captionsType: 'off',
  });
  const { muxEnableSignedUrls } = installationParams;
  const [videoQualityExpanded, setVideoQualityExpanded] = useState<boolean>(true);

  const [validationState, setValidationState] = useState<Record<string, boolean>>({
    playbackPolicies: true,
    captions: true,
  });

  const handleValidationChange = (componentId: string, isValid: boolean) => {
    setValidationState((prev) => ({
      ...prev,
      [componentId]: isValid,
    }));
  };

  const isFormValid = Object.values(validationState).every((isValid) => isValid);

  return (
    <Modal isShown={isShown} onClose={onClose}>
      <Modal.Header title="Configure Mux Upload" onClose={onClose} />
      <Modal.Content>
        <Accordion>
          <Accordion.Item
            title="Video Quality Settings"
            isExpanded={videoQualityExpanded}
            onExpand={() => setVideoQualityExpanded(true)}
            onCollapse={() => setVideoQualityExpanded(false)}>
            <VideoQualitySelector
              selectedQuality={videoQuality}
              onQualityChange={setVideoQuality}
            />
          </Accordion.Item>

          <Accordion.Item title="Privacy Settings">
            <PlaybackPolicySelector
              selectedPolicies={playbackPolicies}
              onPoliciesChange={setPlaybackPolicies}
              enableSignedUrls={muxEnableSignedUrls}
              onValidationChange={(isValid) => handleValidationChange('playbackPolicies', isValid)}
            />
          </Accordion.Item>

          <Accordion.Item title="Captions">
            <CaptionsConfiguration
              captionsConfig={captionsConfig}
              onCaptionsChange={setCaptionsConfig}
              onValidationChange={(isValid) => handleValidationChange('captions', isValid)}
            />
          </Accordion.Item>
        </Accordion>
      </Modal.Content>

      <Modal.Controls>
        <Button size="small" variant="transparent" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="small"
          variant="positive"
          onClick={() => onConfirm({ videoQuality, playbackPolicies, captionsConfig })}
          isDisabled={!isFormValid}>
          Upload
        </Button>
      </Modal.Controls>
    </Modal>
  );
};

const ModalUploadAsset: FC<ModalProps> = (props) => {
  if (!props.isShown) return null;
  return <ModalContent {...props} />;
};

export default ModalUploadAsset;
