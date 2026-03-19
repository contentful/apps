import { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Multiselect,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { css } from '@emotion/css';
import { useMultiselectScrollReflow } from '../../../../../hooks/useMultiselectReflow';
import { multiselect, pillsContainer } from './ContentTypePickerModal.styles';
import { truncateLabel } from '../../../../../utils/utils';

interface ContentTypePickerModalProps {
  sdk: PageAppSDK;
  onClose: () => void;
  // TEMP workaround: Mastra workflow inputs have issues with string[] in some UIs.
  // We pass a single comma-separated string of IDs for now.
  onContinue: (contentTypeIdsCsv: string) => void;
  // onSelect: (contentTypes: ContentTypeProps[]) => void;
  selectedContentTypes: ContentTypeProps[];
  setSelectedContentTypes: (
    contentTypes: ContentTypeProps[] | ((prev: ContentTypeProps[]) => ContentTypeProps[])
  ) => void;
}

export const ContentTypePickerModal = ({
  sdk,
  onClose,
  onContinue,
  selectedContentTypes,
  setSelectedContentTypes,
}: ContentTypePickerModalProps) => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [filteredContentTypes, setFilteredContentTypes] = useState<ContentTypeProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [hasFetchError, setHasFetchError] = useState<boolean>(false);
  const multiselectListRef = useMultiselectScrollReflow(selectedContentTypes);

  const isInvalidSelection = useMemo(
    () => selectedContentTypes.length === 0,
    [selectedContentTypes]
  );

  const isInvalidSelectionError = useMemo(
    () => isInvalidSelection && hasAttemptedSubmit,
    [isInvalidSelection, hasAttemptedSubmit]
  );

  const showFetchError = hasFetchError && !isLoading;

  const selectedContentTypeIdsCsv = useMemo(
    () => selectedContentTypes.map((ct) => ct.sys.id).join(','),
    [selectedContentTypes]
  );

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        setIsLoading(true);
        setHasFetchError(false);
        const space = await sdk.cma.space.get({});
        const environment = await sdk.cma.environment.get({ spaceId: space.sys.id });

        const allContentTypes: ContentTypeProps[] = [];
        let skip = 0;
        const limit = 100;

        while (true) {
          const response = await sdk.cma.contentType.getMany({
            spaceId: space.sys.id,
            environmentId: environment.sys.id,
            query: { limit, skip },
          });

          const items = response.items ?? [];
          allContentTypes.push(...items);

          if (items.length < limit) break;

          if (skip + items.length >= response.total) break;

          skip += items.length;
        }

        setContentTypes(allContentTypes);
        setFilteredContentTypes(allContentTypes);
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

  const onSearchValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    setFilteredContentTypes(
      searchTerm
        ? contentTypes.filter((ct) => ct.name.toLowerCase().includes(searchTerm))
        : contentTypes
    );
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
    onClose();
  };

  const handleContinue = () => {
    if (isInvalidSelection) {
      setHasAttemptedSubmit(true);
      return;
    }
    onContinue(selectedContentTypeIdsCsv);
    // onSelect(selectedContentTypes);
  };

  return (
    <>
      <Modal.Header title="Select content type(s)" onClose={handleClose} />
      <Modal.Content>
        <Paragraph marginBottom="spacingM" color="gray700">
          Select the content type(s) you would like to use with this document.
        </Paragraph>
        <FormControl
          isRequired
          isInvalid={isInvalidSelectionError || showFetchError}
          marginBottom="none">
          <FormControl.Label>Content type</FormControl.Label>
          <Multiselect
            className={multiselect}
            searchProps={{
              searchPlaceholder: 'Search content types',
              onSearchValueChange,
            }}
            currentSelection={selectedContentTypes.map((ct) => ct.name)}
            placeholder={getPlaceholderText()}
            popoverProps={{
              listMaxHeight: 300,
              listRef: multiselectListRef,
            }}>
            {filteredContentTypes.map((ct) => (
              <Multiselect.Option
                className={css({ padding: `0.25rem` })}
                key={ct.sys.id}
                value={ct.sys.id}
                itemId={ct.sys.id}
                isChecked={selectedContentTypes.some((selected) => selected.sys.id === ct.sys.id)}
                isDisabled={isLoading}
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
          <Flex flexWrap="wrap" gap="spacingXs" marginTop="spacingS" className={pillsContainer}>
            {selectedContentTypes.map((ct) => (
              <Pill
                key={ct.sys.id}
                label={truncateLabel(ct.name)}
                onClose={() =>
                  setSelectedContentTypes(
                    selectedContentTypes.filter((selected) => selected.sys.id !== ct.sys.id)
                  )
                }
              />
            ))}
          </Flex>
        )}
      </Modal.Content>
      <Modal.Controls>
        <Button onClick={handleClose} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleContinue} variant="primary" isDisabled={isLoading}>
          Next
        </Button>
      </Modal.Controls>
    </>
  );
};
