import { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Select,
  Spinner,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export interface SelectedContentType {
  id: string;
  name: string;
}

interface ContentTypePickerModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contentTypes: SelectedContentType[]) => void;
  isSubmitting: boolean;
  selectedContentTypes: SelectedContentType[];
  setSelectedContentTypes: (
    contentTypes: SelectedContentType[] | ((prev: SelectedContentType[]) => SelectedContentType[])
  ) => void;
}

export const ContentTypePickerModal = ({
  sdk,
  isOpen,
  onClose,
  onSelect,
  isSubmitting,
  selectedContentTypes,
  setSelectedContentTypes,
}: ContentTypePickerModalProps) => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [hasFetchError, setHasFetchError] = useState<boolean>(false);

  const isInvalidSelection = useMemo(
    () => selectedContentTypes.length === 0,
    [selectedContentTypes]
  );

  const isInvalidSelectionError = useMemo(
    () => isInvalidSelection && hasAttemptedSubmit,
    [isInvalidSelection, hasAttemptedSubmit]
  );

  const showFetchError = hasFetchError && !isLoading;

  useEffect(() => {
    // Fetch content types when component mounts
    const fetchContentTypes = async () => {
      try {
        setIsLoading(true);
        setHasFetchError(false);
        const space = await sdk.cma.space.get({});
        const environment = await sdk.cma.environment.get({ spaceId: space.sys.id });
        const contentTypesResponse = await sdk.cma.contentType.getMany({
          spaceId: space.sys.id,
          environmentId: environment.sys.id,
        });
        setContentTypes(contentTypesResponse.items || []);
      } catch (error) {
        console.error('Failed to fetch content types:', error);
        setHasFetchError(true);
        setContentTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentTypes();
  }, [sdk]);

  useEffect(() => {
    // Reset attempt flag when modal opens (but preserve selectedContentTypes from parent)
    if (isOpen) {
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const handleAddContentType = (contentTypeId: string) => {
    if (!contentTypeId || isSubmitting) return;

    const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
    if (contentType && !selectedContentTypes.some((ct) => ct.id === contentTypeId)) {
      setSelectedContentTypes([
        ...selectedContentTypes,
        { id: contentType.sys.id, name: contentType.name },
      ]);
    }
  };

  const handleRemoveContentType = (contentTypeId: string) => {
    if (isSubmitting) return;
    setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== contentTypeId));
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing during submission
    onClose();
  };

  const handleContinue = () => {
    if (isInvalidSelection) {
      setHasAttemptedSubmit(true);
      return;
    }

    onSelect(selectedContentTypes);
  };

  const availableContentTypes = useMemo(
    () =>
      contentTypes.filter(
        (ct) => !selectedContentTypes.some((selected) => selected.id === ct.sys.id)
      ),
    [contentTypes, selectedContentTypes]
  );

  return (
    <Modal title="Select content type(s)" isShown={isOpen} onClose={handleClose} size="medium">
      {() => (
        <>
          <Modal.Header title="Select content type(s)" onClose={handleClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM" color="gray700">
              Select the content type(s) you would like to use with this sync.
            </Paragraph>
            <FormControl isRequired isInvalid={isInvalidSelectionError || showFetchError}>
              <FormControl.Label>Content type</FormControl.Label>
              <Select
                id="content-type-select"
                name="content-type-select"
                value=""
                onChange={(e) => {
                  handleAddContentType(e.target.value);
                }}
                isDisabled={isLoading || availableContentTypes.length === 0 || isSubmitting}>
                <Select.Option value="" isDisabled>
                  {isLoading ? 'Loading content types...' : 'Select one or more'}
                </Select.Option>
                {availableContentTypes.map((ct) => (
                  <Select.Option key={ct.sys.id} value={ct.sys.id}>
                    {ct.name}
                  </Select.Option>
                ))}
              </Select>
              {showFetchError && (
                <FormControl.ValidationMessage>
                  Unable to load content types.
                </FormControl.ValidationMessage>
              )}
              {isInvalidSelectionError && (
                <FormControl.ValidationMessage>
                  You must select at least one content type.
                </FormControl.ValidationMessage>
              )}
            </FormControl>

            {selectedContentTypes.length > 0 && (
              <Flex flexWrap="wrap" gap="spacingXs" marginTop="spacingS">
                {selectedContentTypes.map((ct) => (
                  <Pill
                    key={ct.id}
                    label={ct.name}
                    onClose={isSubmitting ? undefined : () => handleRemoveContentType(ct.id)}
                  />
                ))}
              </Flex>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleClose} variant="secondary" isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              variant="primary"
              isDisabled={isLoading || isSubmitting}
              endIcon={isSubmitting ? <Spinner /> : undefined}>
              Next
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
