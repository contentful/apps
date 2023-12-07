import { useState } from 'react';
import { Button, FormControl, Modal, Radio, Table } from '@contentful/f36-components';
import { contentTypeSelection } from '@constants/configCopy';
import { styles } from './ContentTypeSelectionModal.styles';
import { Notification } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import { ContentTypeProps } from 'contentful-management';
import EmptyState from '@components/config/EmptyState/EmptyState';
import WebApp from '@components/config/EmptyState/WebApp';

interface Props {
  isShown: boolean;
  onClose: () => void;
  savedContentTypeId: string;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  contentTypes: ContentTypeProps[];
  contentTypeConfigLink: string;
}

const ContentTypeSelectionModal = (props: Props) => {
  const {
    isShown,
    onClose,
    savedContentTypeId,
    handleNotificationEdit,
    contentTypes,
    contentTypeConfigLink,
  } = props;

  const [selectedContentTypeId, setSelectedContentTypeId] = useState(savedContentTypeId ?? '');

  const { title, button, link, emptyContent, emptyHeading } = contentTypeSelection.modal;

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <ModalHeader title={title} onClose={onClose} />
          <Modal.Content>
            {contentTypes.length ? (
              <FormControl as="fieldset" marginBottom="none">
                <Table className={styles.table}>
                  <Table.Body>
                    {contentTypes.map((contentType) => (
                      <Table.Row key={contentType.sys.id}>
                        <Table.Cell>
                          <Radio
                            id={contentType.sys.id}
                            isChecked={selectedContentTypeId === contentType.sys.id}
                            onChange={() => setSelectedContentTypeId(contentType.sys.id)}>
                            {contentType.name}
                          </Radio>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </FormControl>
            ) : (
              <EmptyState
                image={<WebApp />}
                heading={emptyHeading}
                body={emptyContent}
                linkSubstring={link}
                linkHref={contentTypeConfigLink}
              />
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                handleNotificationEdit({ contentTypeId: selectedContentTypeId });
                onClose();
              }}
              isDisabled={!selectedContentTypeId}>
              {button}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default ContentTypeSelectionModal;
