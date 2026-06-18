import { Button, Modal, Paragraph, Text, List, Flex } from '@contentful/f36-components';
import { ArrowRightIcon } from '@contentful/f36-icons';
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
                      <Flex alignItems="center" gap="spacing2Xs" as="span">
                        <Text as="span" fontWeight="fontWeightDemiBold">
                          {loc.entryName}
                        </Text>
                        <ArrowRightIcon size="tiny" />
                        <Text as="span">{loc.fieldName}</Text>
                        <Text as="span" fontColor="gray500">
                          ({loc.fieldType})
                        </Text>
                      </Flex>
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
