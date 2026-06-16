import { Button, Modal, Paragraph, Text, List } from '@contentful/f36-components';
import type { EditLocationOption } from '@types';

interface RemoveContentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  locations: EditLocationOption[];
}

export const RemoveContentModal = ({
  isOpen,
  onConfirm,
  onCancel,
  locations,
}: RemoveContentModalProps) => {
  return (
    <Modal isShown={isOpen} onClose={onCancel} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title="Remove content from entry" onClose={onCancel} />
          <Modal.Content>
            <Paragraph>
              Are you sure you&apos;d like to remove this content from the entry?
            </Paragraph>
            {locations.length > 0 && (
              <>
                <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
                  The following mappings will be removed:
                </Text>
                <List>
                  {locations.map((loc) => (
                    <List.Item key={loc.id}>
                      <Text as="span" fontWeight="fontWeightDemiBold">
                        {loc.entryName}
                      </Text>
                      {' → '}
                      {loc.fieldName}
                      <Text as="span" fontColor="gray500">
                        {' '}
                        ({loc.fieldType})
                      </Text>
                    </List.Item>
                  ))}
                </List>
              </>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onCancel} size="small" variant="secondary">
              Cancel
            </Button>
            <Button onClick={onConfirm} size="small" variant="negative">
              Remove
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
