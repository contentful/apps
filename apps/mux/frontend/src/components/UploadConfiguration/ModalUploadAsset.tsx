import { FC, useState } from 'react';
import { Modal, Button, Accordion } from '@contentful/f36-components';
import { VideoQualitySelector } from './VideoQualitySelector';
import { PlaybackPolicySelector } from './PlaybackPolicySelector';
import { CaptionsConfiguration, CaptionsConfig } from './CaptionsConfiguration';
import Mp4RenditionsConfiguration, { Mp4RenditionsConfig } from './Mp4RenditionsConfiguration';
import MetadataConfiguration, { MetadataConfig } from './MetadataConfiguration';

export interface ModalData {
  videoQuality: string;
  playbackPolicies: string[];
  captionsConfig: CaptionsConfig;
  mp4Config: Mp4RenditionsConfig;
  metadataConfig: MetadataConfig;
}

interface ModalUploadAssetProps {
  isShown: boolean;
  onClose: () => void;
  onConfirm: (data: ModalData) => void;
  installationParams: {
    muxEnableSignedUrls: boolean;
  };
}

const ModalContent: FC<ModalUploadAssetProps> = ({
  isShown = false,
  onClose,
  onConfirm,
  installationParams,
}) => {
  const [modalData, setModalData] = useState<ModalData>({
    videoQuality: 'plus',
    playbackPolicies: ['public'],
    captionsConfig: {
      captionsType: 'off',
      languageCode: null,
      languageName: null,
      url: null,
      closedCaptions: null,
    },
    mp4Config: {
      enabled: false,
      audioOnly: false,
      highestResolution: false,
    },
    metadataConfig: {
      enabled: false,
      standardMetadata: {
        title: undefined,
        creatorId: undefined,
        externalId: undefined,
      },
      customMetadata: undefined,
    },
  });
  const { muxEnableSignedUrls } = installationParams;
  const [videoQualityExpanded, setVideoQualityExpanded] = useState<boolean>(true);

  const [validationState, setValidationState] = useState<Record<string, boolean>>({
    playbackPolicies: true,
    captions: true,
    mp4: true,
    metadata: true,
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
              selectedQuality={modalData.videoQuality}
              onQualityChange={(quality) =>
                setModalData((prev) => ({ ...prev, videoQuality: quality }))
              }
            />
          </Accordion.Item>

          <Accordion.Item title="Privacy Settings">
            <PlaybackPolicySelector
              selectedPolicies={modalData.playbackPolicies}
              onPoliciesChange={(policies) =>
                setModalData((prev) => ({ ...prev, playbackPolicies: policies }))
              }
              enableSignedUrls={muxEnableSignedUrls}
              onValidationChange={(isValid) => handleValidationChange('playbackPolicies', isValid)}
            />
          </Accordion.Item>

          <Accordion.Item title="Metadata">
            <MetadataConfiguration
              metadataConfig={modalData.metadataConfig}
              onMetadataChange={(config) =>
                setModalData((prev) => ({ ...prev, metadataConfig: config }))
              }
              onValidationChange={(isValid) => handleValidationChange('metadata', isValid)}
            />
          </Accordion.Item>

          <Accordion.Item title="Captions">
            <CaptionsConfiguration
              captionsConfig={modalData.captionsConfig}
              onCaptionsChange={(config) =>
                setModalData((prev) => ({ ...prev, captionsConfig: config }))
              }
              onValidationChange={(isValid) => handleValidationChange('captions', isValid)}
            />
          </Accordion.Item>

          <Accordion.Item title="MP4 Generation">
            <Mp4RenditionsConfiguration
              mp4Config={modalData.mp4Config}
              onMp4ConfigChange={(config) =>
                setModalData((prev) => ({ ...prev, mp4Config: config }))
              }
              onValidationChange={(isValid) => handleValidationChange('mp4', isValid)}
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
          onClick={() => onConfirm(modalData)}
          isDisabled={!isFormValid}>
          Upload
        </Button>
      </Modal.Controls>
    </Modal>
  );
};

const ModalUploadAsset: FC<ModalUploadAssetProps> = (props) => {
  if (!props.isShown) return null;
  return <ModalContent {...props} />;
};

export default ModalUploadAsset;
