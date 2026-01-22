import { FC, useState, useEffect, useMemo } from 'react';
import { Modal, Button, Accordion, Note } from '@contentful/f36-components';
import { VideoQualitySelector } from './VideoQualitySelector';
import { PlaybackPolicySelector } from './PlaybackPolicySelector';
import { CaptionsConfiguration, CaptionsConfig } from './CaptionsConfiguration';
import Mp4RenditionsConfiguration, { Mp4RenditionsConfig } from './Mp4RenditionsConfiguration';
import MetadataConfiguration, { MetadataConfig } from './MetadataConfiguration';
import { MuxContentfulObject, PolicyType } from '../../util/types';
import { FieldExtensionSDK } from '@contentful/app-sdk';

// Audio file extensions for detection
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma', '.aiff', '.opus'];

/**
 * Detects if the input is an audio-only file based on:
 * - File MIME type (for uploaded files)
 * - URL extension (for remote URLs)
 */
const isAudioFile = (file: File | null, url: string | null): boolean => {
  // Check file MIME type
  if (file) {
    return file.type.startsWith('audio/');
  }
  
  // Check URL extension
  if (url) {
    const urlLower = url.toLowerCase();
    // Remove query params and hash for extension check
    const cleanUrl = urlLower.split('?')[0].split('#')[0];
    return AUDIO_EXTENSIONS.some(ext => cleanUrl.endsWith(ext));
  }
  
  return false;
};

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
  /** File being uploaded (from drag & drop or file picker) */
  file?: File | null;
  /** URL for remote upload */
  pendingUploadURL?: string | null;
}

const ModalContent: FC<MuxAssetConfigurationModalProps> = ({
  isShown = false,
  onClose,
  onConfirm,
  installationParams,
  isEditMode = false,
  asset,
  sdk,
  file = null,
  pendingUploadURL = null,
}) => {
  const { muxEnableSignedUrls, muxEnableDRM } = installationParams;

  // Detect if the input is an audio-only file
  const isAudioOnly = useMemo(
    () => isAudioFile(file, pendingUploadURL),
    [file, pendingUploadURL]
  );

  // DRM is disabled for audio files
  const effectiveDRMEnabled = muxEnableDRM && !isAudioOnly;

  // Determine default policy: if DRM was enabled but this is audio, fall back to signed (if available) or public
  const getDefaultPolicy = (): PolicyType => {
    if (effectiveDRMEnabled) return 'drm';
    if (muxEnableSignedUrls) return 'signed';
    return 'public';
  };

  const [modalData, setModalData] = useState<ModalData>({
    videoQuality: 'plus',
    playbackPolicies: [getDefaultPolicy()],
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

  // Update policy when audio detection changes (e.g., when modal opens with new file)
  useEffect(() => {
    setModalData((prev) => {
      if (isAudioOnly && prev.playbackPolicies.includes('drm')) {
        // If current policy is DRM but this is audio, switch to signed or public
        const fallbackPolicy: PolicyType = muxEnableSignedUrls ? 'signed' : 'public';
        return { ...prev, playbackPolicies: [fallbackPolicy] };
      }
      return prev;
    });
  }, [isAudioOnly, muxEnableSignedUrls]);

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
              {isAudioOnly && (
                <Note variant="warning" style={{ marginBottom: '1rem' }}>
                  Audio files do not support DRM protection. Please use the Protected option for secure playback.
                </Note>
              )}
              <PlaybackPolicySelector
                selectedPolicies={modalData.playbackPolicies}
                onPoliciesChange={(policies) =>
                  setModalData((prev) => ({ ...prev, playbackPolicies: policies }))
                }
                enableSignedUrls={muxEnableSignedUrls}
                enableDRM={effectiveDRMEnabled}
                onValidationChange={(isValid) =>
                  handleValidationChange('playbackPolicies', isValid)
                }
                isAudioOnly={isAudioOnly}
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
