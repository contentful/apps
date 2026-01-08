import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Button,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Multiselect,
  Spinner,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { css } from '@emotion/css';

interface ContentTypePickerModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contentTypes: ContentTypeProps[]) => void;
  isSubmitting: boolean;
  selectedContentTypes: ContentTypeProps[];
  setSelectedContentTypes: (
    contentTypes: ContentTypeProps[] | ((prev: ContentTypeProps[]) => ContentTypeProps[])
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
  const [filteredContentTypes, setFilteredContentTypes] = useState<ContentTypeProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [hasFetchError, setHasFetchError] = useState<boolean>(false);
  const multiselectListRef = useRef<HTMLUListElement>(null);

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
        setFilteredContentTypes(contentTypesResponse.items || []);
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
    // Reset attempt flag and selected content types when modal opens
    if (isOpen) {
      setHasAttemptedSubmit(false);
      setSelectedContentTypes([]);
    }
  }, [isOpen, setSelectedContentTypes]);

  useEffect(() => {
    // Recalculate the Multiselect dropdown position when selection changes
    if (multiselectListRef.current) {
      const element = multiselectListRef.current;
      const currentScroll = element.scrollTop;
      const maxScroll = element.scrollHeight - element.clientHeight;

      if (currentScroll >= maxScroll) {
        element.scrollTop = currentScroll - 1;
      } else {
        element.scrollTop = currentScroll + 1;
      }

      element.scrollTop = currentScroll;
    }
  }, [selectedContentTypes]);

  const onSearchValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (!searchTerm) {
      setFilteredContentTypes(contentTypes);
      return;
    }
    const filtered = contentTypes.filter((ct) => ct.name.toLowerCase().includes(searchTerm));
    setFilteredContentTypes(filtered);
  };

  const getPlaceholderText = () => {
    if (isLoading) return 'Loading content types...';
    if (contentTypes.length === 0) return 'No content types in space';
    if (selectedContentTypes.length === 0) return 'Select one or more';
    return `${selectedContentTypes.length} selected`;
  };

  const handleSelectContentType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = e.target;
    if (checked) {
      setSelectedContentTypes([
        ...selectedContentTypes,
        contentTypes.find((ct) => ct.sys.id === value) as ContentTypeProps,
      ]);
    } else {
      setSelectedContentTypes(selectedContentTypes.filter((selected) => selected.sys.id !== value));
    }
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
              <Multiselect
                searchProps={{
                  searchPlaceholder: 'Search content types',
                  onSearchValueChange,
                }}
                currentSelection={selectedContentTypes.map((ct) => ct.name)}
                placeholder={getPlaceholderText()}
                popoverProps={{
                  listRef: multiselectListRef,
                }}>
                {filteredContentTypes.map((ct) => (
                  <Multiselect.Option
                    className={css({ padding: `0.25rem` })}
                    key={ct.sys.id}
                    value={ct.sys.id}
                    itemId={ct.sys.id}
                    isChecked={selectedContentTypes.some(
                      (selected) => selected.sys.id === ct.sys.id
                    )}
                    isDisabled={isLoading || isSubmitting}
                    onSelectItem={handleSelectContentType}>
                    {ct.name}
                  </Multiselect.Option>
                ))}
              </Multiselect>
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
                    key={ct.sys.id}
                    label={ct.name}
                    onClose={
                      isSubmitting
                        ? undefined
                        : () =>
                            setSelectedContentTypes(
                              selectedContentTypes.filter(
                                (selected) => selected.sys.id !== ct.sys.id
                              )
                            )
                    }
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
              isLoading={isSubmitting}>
              Next
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
