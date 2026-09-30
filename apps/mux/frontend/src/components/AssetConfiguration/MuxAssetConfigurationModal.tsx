import { FC, useState, useEffect, useMemo } from 'react';
import { Modal, Button, Accordion, Note } from '@contentful/f36-components';
import { VideoQualitySelector } from './VideoQualitySelector';
import { PlaybackPolicySelector } from './PlaybackPolicySelector';
import { CaptionsConfiguration, CaptionsConfig } from './CaptionsConfiguration';
import Mp4RenditionsConfiguration, { Mp4RenditionsConfig } from './Mp4RenditionsConfiguration';
import MetadataConfiguration, { MetadataConfig } from './MetadataConfiguration';
import AutomationConfiguration from './AutomationConfiguration';
import { MuxContentfulObject, PolicyType } from '../../util/types';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { MuxApiService } from '../../util/muxApi';
import { useRobotsDirectiveNames } from '../Robots/useRobotsDirectiveNames';
import FieldModal from '../FieldModal';

// Audio file extensions for detection
const AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
  '.flac',
  '.wma',
  '.aiff',
  '.opus',
];

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
    return AUDIO_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
  }

  return false;
};

export interface ModalData {
  videoQuality: string;
  playbackPolicies: PolicyType[];
  captionsConfig: CaptionsConfig;
  mp4Config: Mp4RenditionsConfig;
  metadataConfig: MetadataConfig;
  /**
   * Robots directives to attach at asset creation, pre-filled from the installation parameters
   * and deselectable per upload by anyone who can run Robots. Empty means no automation on this
   * upload.
   */
  directiveIds: string[];
}

interface MuxAssetConfigurationModalProps {
  isShown: boolean;
  onClose: () => void;
  onConfirm: (data: ModalData) => void;
  installationParams: {
    muxEnableSignedUrls: boolean;
    muxEnableDRM?: boolean;
    muxDefaultDirectiveIds?: string[];
  };
  isEditMode?: boolean;
  asset?: MuxContentfulObject;
  sdk: FieldExtensionSDK;
  /**
   * Whether this person may change which directives run on the upload. When not, the configured
   * defaults are listed read-only and still attached. See `canRunRobots`, ADR-0016.
   */
  canChooseDirectives: boolean;
  /** Only used to put names on the configured Robots directives. Absent until the app has one. */
  muxApi?: MuxApiService;
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
  canChooseDirectives,
  muxApi,
  file = null,
  pendingUploadURL = null,
}) => {
  // Use explicit defaults to handle undefined values from SDK
  const muxEnableSignedUrls = installationParams.muxEnableSignedUrls ?? false;
  const muxEnableDRM = installationParams.muxEnableDRM ?? false;
  const defaultDirectiveIds = useMemo(
    () => installationParams.muxDefaultDirectiveIds ?? [],
    [installationParams.muxDefaultDirectiveIds]
  );

  // Detect if the input is an audio-only file
  const isAudioOnly = useMemo(() => isAudioFile(file, pendingUploadURL), [file, pendingUploadURL]);

  // Resolved only for a real upload — editing an existing asset creates nothing, so it has no
  // Automation section to label. Not awaited anywhere: the ids render until the names arrive.
  const { names: directiveNames, missingIds: missingDirectiveIds } = useRobotsDirectiveNames(
    muxApi,
    defaultDirectiveIds,
    !isEditMode
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
    directiveIds: defaultDirectiveIds,
  });

  // The configured defaults arrive from installation parameters, which are not available on the
  // very first render in every location, so re-seed the selection when they turn up.
  useEffect(() => {
    setModalData((prev) =>
      prev.directiveIds.length === 0 && defaultDirectiveIds.length > 0
        ? { ...prev, directiveIds: defaultDirectiveIds }
        : prev
    );
  }, [defaultDirectiveIds]);

  // Those parameters are a snapshot from when this page loaded, and can name a directive Mux no
  // longer has. It cannot run, so it is not attached — as soon as a complete listing says so.
  useEffect(() => {
    if (missingDirectiveIds.length === 0) return;
    setModalData((prev) => {
      const kept = prev.directiveIds.filter((id) => !missingDirectiveIds.includes(id));
      return kept.length === prev.directiveIds.length ? prev : { ...prev, directiveIds: kept };
    });
  }, [missingDirectiveIds]);

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
        // Editing an existing asset creates nothing, so there is no `new_asset_settings` for a
        // directive to ride on. Ad-hoc runs live in the Robots tab instead.
        directiveIds: [],
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
    <FieldModal isShown={isShown} onClose={onClose}>
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
                  Audio files do not support DRM protection. Please use the Protected option for
                  secure playback.
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

              <Accordion.Item title="Automation">
                <AutomationConfiguration
                  availableDirectiveIds={defaultDirectiveIds}
                  selectedDirectiveIds={modalData.directiveIds}
                  missingDirectiveIds={missingDirectiveIds}
                  directiveNames={directiveNames}
                  isReadOnly={!canChooseDirectives}
                  onChange={(directiveIds) => setModalData((prev) => ({ ...prev, directiveIds }))}
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
    </FieldModal>
  );
};

const MuxAssetConfigurationModal: FC<MuxAssetConfigurationModalProps> = (props) => {
  if (!props.isShown) return null;
  return <ModalContent {...props} />;
};

export default MuxAssetConfigurationModal;
