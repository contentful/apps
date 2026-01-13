import { FC, useState, useEffect } from 'react';
import { Modal, Button, Accordion } from '@contentful/f36-components';
import { VideoQualitySelector } from './VideoQualitySelector';
import { PlaybackPolicySelector } from './PlaybackPolicySelector';
import { CaptionsConfiguration, CaptionsConfig } from './CaptionsConfiguration';
import Mp4RenditionsConfiguration, { Mp4RenditionsConfig } from './Mp4RenditionsConfiguration';
import MetadataConfiguration, { MetadataConfig } from './MetadataConfiguration';
import { MuxContentfulObject, PolicyType } from '../../util/types';
import { FieldExtensionSDK } from '@contentful/app-sdk';

export interface ModalData {
  videoQuality: string;
  playbackPolicies: PolicyType[];
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
    muxEnableDRM?: boolean;
  };
  isEditMode?: boolean;
  asset?: MuxContentfulObject;
  sdk: FieldExtensionSDK;
}

const ModalContent: FC<MuxAssetConfigurationModalProps> = ({
  isShown = false,
  onClose,
  onConfirm,
  installationParams,
  isEditMode = false,
  asset,
  sdk,
}) => {
  const { muxEnableSignedUrls, muxEnableDRM } = installationParams;

  const [modalData, setModalData] = useState<ModalData>({
    videoQuality: 'plus',
    playbackPolicies: muxEnableSignedUrls ? ['signed'] : ['public'],
    captionsConfig: {
      captionsType: 'off',
      languageCode: null,
      languageName: null,
      url: null,
      closedCaptions: null,
    },
    mp4Config: {
      audioOnly: false,
      highestResolution: false,
    },
    metadataConfig: {
      standardMetadata: {
        title: undefined,
        externalId: undefined,
      },
    },
  });

  useEffect(() => {
    if (isEditMode && asset) {
      // Determine the current playback policy 
      const currentPolicy: PolicyType = asset.drmPlaybackId
        ? 'drm'
        : asset.signedPlaybackId
          ? 'signed'
          : 'public';

      setModalData({
        videoQuality: 'plus',
        playbackPolicies: [currentPolicy],
        captionsConfig: {
          captionsType: 'off',
          languageCode: null,
          languageName: null,
          url: null,
          closedCaptions: null,
        },
        mp4Config: {
          audioOnly: false,
          highestResolution: false,
        },
        metadataConfig: {
          standardMetadata: {
            title: asset.meta?.title,
            externalId: asset.meta?.external_id,
          },
        },
      });
    }
  }, [isEditMode, asset]);

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
                enableDRM={muxEnableDRM}
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
              sdk={sdk}
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
