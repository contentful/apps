import { FC, useState, useEffect } from 'react';
import { Modal, Button, Accordion } from '@contentful/f36-components';
import { VideoQualitySelector } from './VideoQualitySelector';
import { PlaybackPolicySelector } from './PlaybackPolicySelector';
import { CaptionsConfiguration, CaptionsConfig } from './CaptionsConfiguration';
import Mp4RenditionsConfiguration, { Mp4RenditionsConfig } from './Mp4RenditionsConfiguration';
import MetadataConfiguration, { MetadataConfig } from './MetadataConfiguration';
import { MuxContentfulObject } from '../../util/types';

export interface ModalData {
  videoQuality: string;
  playbackPolicies: string[];
  captionsConfig: CaptionsConfig;
  mp4Config: Mp4RenditionsConfig;
  metadataConfig: MetadataConfig;
}

interface MuxAssetConfigurationModalProps {
  isShown: boolean;
  onClose: () => void;
  onConfirm: (data: ModalData) => void;
  installationParams: {
    muxEnableSignedUrls: boolean;
  };
  isEditMode?: boolean;
  asset?: MuxContentfulObject;
}

const ModalContent: FC<MuxAssetConfigurationModalProps> = ({
  isShown = false,
  onClose,
  onConfirm,
  installationParams,
  isEditMode = false,
  asset,
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

  useEffect(() => {
    if (isEditMode && asset) {
      const hasMetadata =
        !!asset.meta?.title ||
        !!asset.meta?.creator_id ||
        !!asset.meta?.external_id ||
        !!asset.passthrough;

      setModalData({
        videoQuality: 'plus',
        playbackPolicies: asset.signedPlaybackId ? ['signed'] : ['public'],
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
          enabled: hasMetadata,
          standardMetadata: {
            title: asset.meta?.title,
            creatorId: asset.meta?.creator_id,
            externalId: asset.meta?.external_id,
          },
          customMetadata: asset.passthrough,
        },
      });
    }
  }, [isEditMode, asset]);

  const { muxEnableSignedUrls } = installationParams;
  const [mainCategoryExpanded, setMainCategoryExpanded] = useState<boolean>(true);

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
      <Modal.Header
        title={isEditMode ? 'Edit Mux Asset' : 'Configure Mux Upload'}
        onClose={onClose}
      />
      <Modal.Content>
        <Accordion>
          {!isEditMode && (
            <Accordion.Item
              title="Video Quality Settings"
              isExpanded={mainCategoryExpanded}
              onExpand={() => setMainCategoryExpanded(true)}
              onCollapse={() => setMainCategoryExpanded(false)}>
              <VideoQualitySelector
                selectedQuality={modalData.videoQuality}
                onQualityChange={(quality) =>
                  setModalData((prev) => ({ ...prev, videoQuality: quality }))
                }
              />
            </Accordion.Item>
          )}

          {!isEditMode && (
            <Accordion.Item title="Privacy Settings">
              <PlaybackPolicySelector
                selectedPolicies={modalData.playbackPolicies}
                onPoliciesChange={(policies) =>
                  setModalData((prev) => ({ ...prev, playbackPolicies: policies }))
                }
                enableSignedUrls={muxEnableSignedUrls}
                onValidationChange={(isValid) =>
                  handleValidationChange('playbackPolicies', isValid)
                }
              />
            </Accordion.Item>
          )}

          <Accordion.Item
            title="Metadata"
            {...(isEditMode
              ? {
                  isExpanded: mainCategoryExpanded,
                  onExpand: () => setMainCategoryExpanded(true),
                  onCollapse: () => setMainCategoryExpanded(false),
                }
              : {})}>
            <MetadataConfiguration
              metadataConfig={modalData.metadataConfig}
              onMetadataChange={(config) =>
                setModalData((prev) => ({ ...prev, metadataConfig: config }))
              }
              onValidationChange={(isValid) => handleValidationChange('metadata', isValid)}
            />
          </Accordion.Item>

          {!isEditMode && (
            <>
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
            </>
          )}
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
          {isEditMode ? 'Update' : 'Upload'}
        </Button>
      </Modal.Controls>
    </Modal>
  );
};

const MuxAssetConfigurationModal: FC<MuxAssetConfigurationModalProps> = (props) => {
  if (!props.isShown) return null;
  return <ModalContent {...props} />;
};

export default MuxAssetConfigurationModal;
