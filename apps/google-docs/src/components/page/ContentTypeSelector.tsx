import { Button, Flex } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypePickerModal, SelectedContentType } from './ContentTypePickerModal';

interface ContentTypeSelectorProps {
  sdk: PageAppSDK;
  isDisabled?: boolean;
  isContentTypePickerOpen: boolean;
  setIsContentTypePickerOpen: (isOpen: boolean) => void;
  onContentTypesSelected: (contentTypeIds: string[]) => void;
}

export const ContentTypeSelector = ({
  sdk,
  isDisabled,
  isContentTypePickerOpen,
  setIsContentTypePickerOpen,
  onContentTypesSelected,
}: ContentTypeSelectorProps) => {
  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const names = contentTypes.map((ct) => ct.name).join(', ');
    const ids = contentTypes.map((ct) => ct.id);

    sdk.notifier.success(
      `Selected ${contentTypes.length} content type${contentTypes.length > 1 ? 's' : ''}: ${names}`
    );

    onContentTypesSelected(ids);
    setIsContentTypePickerOpen(false);
  };

  return (
    <>
      <Flex marginTop="spacingM">
        <Button
          variant="primary"
          onClick={() => {
            setIsContentTypePickerOpen(true);
          }}
          isDisabled={isDisabled}>
          Select Content Type
        </Button>
      </Flex>
      <ContentTypePickerModal
        sdk={sdk}
        isOpen={isContentTypePickerOpen}
        onClose={() => {
          setIsContentTypePickerOpen(false);
        }}
        onSelect={handleContentTypeSelected}
      />
    </>
  );
};
