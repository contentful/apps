import { useEffect, useState } from 'react';
import { Button, FormControl, Modal, Paragraph, Select } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

interface ContentTypePickerModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contentTypeId: string, contentTypeName: string) => void;
}

export const ContentTypePickerModal = ({
  sdk,
  isOpen,
  onClose,
  onSelect,
}: ContentTypePickerModalProps) => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>('');
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
      setSelectedContentType('');
    }
  }, [isOpen]);

  const handleContinue = () => {
    if (!selectedContentType) {
      sdk.notifier.error('Please select a content type');
      return;
    }

    const contentType = contentTypes.find((ct) => ct.sys.id === selectedContentType);
    if (contentType) {
      onSelect(contentType.sys.id, contentType.name);
    }
  };

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
              <FormControl.Label>Content Type</FormControl.Label>
              <Select
                id="content-type-select"
                name="content-type-select"
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                isDisabled={isLoading}>
                <Select.Option value="" isDisabled>
                  {isLoading ? 'Loading content types...' : 'Select one or more'}
                </Select.Option>
                {contentTypes.map((ct) => (
                  <Select.Option key={ct.sys.id} value={ct.sys.id}>
                    {ct.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              variant="positive"
              isDisabled={!selectedContentType || isLoading}>
              Continue
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
