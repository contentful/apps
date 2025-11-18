import { useEffect, useState } from 'react';
import {
  Button,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Select,
  Text,
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
}

export const ContentTypePickerModal = ({
  sdk,
  isOpen,
  onClose,
  onSelect,
}: ContentTypePickerModalProps) => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<SelectedContentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch content types when component mounts
    const fetchContentTypes = async () => {
      try {
        setIsLoading(true);
        const space = await sdk.cma.space.get({});
        const environment = await sdk.cma.environment.get({ spaceId: space.sys.id });
        const contentTypesResponse = await sdk.cma.contentType.getMany({
          spaceId: space.sys.id,
          environmentId: environment.sys.id,
        });
        setContentTypes(contentTypesResponse.items || []);
      } catch (error) {
        console.error('Failed to fetch content types:', error);
        sdk.notifier.error('Failed to load content types');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentTypes();
  }, [sdk]);

  useEffect(() => {
    // Reset selection when modal opens
    if (isOpen) {
      setSelectedContentTypes([]);
    }
  }, [isOpen]);

  const handleAddContentType = (contentTypeId: string) => {
    if (!contentTypeId) return;

    const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
    if (contentType && !selectedContentTypes.some((ct) => ct.id === contentTypeId)) {
      setSelectedContentTypes([
        ...selectedContentTypes,
        { id: contentType.sys.id, name: contentType.name },
      ]);
    }
  };

  const handleRemoveContentType = (contentTypeId: string) => {
    setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== contentTypeId));
  };

  const handleContinue = () => {
    if (selectedContentTypes.length === 0) {
      sdk.notifier.error('Please select at least one content type');
      return;
    }

    onSelect(selectedContentTypes);
  };

  const availableContentTypes = contentTypes.filter(
    (ct) => !selectedContentTypes.some((selected) => selected.id === ct.sys.id)
  );

  return (
    <Modal title="Select content type(s)" isShown={isOpen} onClose={onClose} size="medium">
      {() => (
        <>
          <Modal.Header title="Select content type(s)" onClose={onClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM">
              Select the content type(s) you would like to use with this sync.
            </Paragraph>
            <FormControl isRequired>
              <FormControl.Label>Content type</FormControl.Label>
              <Select
                id="content-type-select"
                name="content-type-select"
                value=""
                onChange={(e) => {
                  handleAddContentType(e.target.value);
                }}
                isDisabled={isLoading || availableContentTypes.length === 0}>
                <Select.Option value="" isDisabled>
                  {isLoading ? 'Loading content types...' : 'Select one or more'}
                </Select.Option>
                {availableContentTypes.map((ct) => (
                  <Select.Option key={ct.sys.id} value={ct.sys.id}>
                    {ct.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>

            {selectedContentTypes.length > 0 && (
              <Flex flexWrap="wrap" gap="spacingXs" marginTop="spacingS">
                {selectedContentTypes.map((ct) => (
                  <Pill
                    key={ct.id}
                    label={ct.name}
                    onClose={() => handleRemoveContentType(ct.id)}
                  />
                ))}
              </Flex>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              variant="positive"
              isDisabled={selectedContentTypes.length === 0 || isLoading}>
              Continue
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
