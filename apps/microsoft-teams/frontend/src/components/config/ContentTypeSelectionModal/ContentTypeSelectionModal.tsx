import { useState, useCallback } from 'react';
import { Box, Button, FormControl, Modal, Radio, Table } from '@contentful/f36-components';
import { contentTypeSelection } from '@constants/configCopy';
import { styles } from './ContentTypeSelectionModal.styles';
import { Notification } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import { ContentTypeProps } from 'contentful-management';
import EmptyState from '@components/config/EmptyState/EmptyState';
import WebApp from '@components/config/EmptyState/WebApp';
import DebouncedSearchInput from '@components/config/DebouncedSearchInput/DebouncedSearchInput';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import SearchableList from '@components/config/SearchableList/SearchableList';

interface Props {
  isShown: boolean;
  onClose: () => void;
  savedContentTypeId: string;
  savedContentTypeName: string;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  contentTypes: ContentTypeProps[];
  contentTypeConfigLink: string;
  error: boolean;
}

const ContentTypeSelectionModal = (props: Props) => {
  const {
    isShown,
    onClose,
    savedContentTypeId,
    savedContentTypeName,
    handleNotificationEdit,
    contentTypes,
    contentTypeConfigLink,
    error,
  } = props;

  const [selectedContentType, setSelectedContentType] = useState({
    contentTypeId: savedContentTypeId,
    contentTypeName: savedContentTypeName,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { title, button, link, emptyContent, emptyHeading, errorMessage, searchPlaceholder } =
    contentTypeSelection.modal;

  const handleSearchQueryUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const renderRow = useCallback(
    (contentType: ContentTypeProps) => {
      return (
        <Table.Row
          key={contentType.sys.id}
          onClick={() =>
            setSelectedContentType({
              contentTypeId: contentType.sys.id,
              contentTypeName: contentType.name,
            })
          }
          className={styles.tableRow}>
          <Table.Cell>
            <Radio
              id={contentType.sys.id}
              isChecked={selectedContentType.contentTypeId === contentType.sys.id}
              onChange={() => null /* noop, since clicking entire row selects this radio */}>
              {contentType.name}
            </Radio>
          </Table.Cell>
        </Table.Row>
      );
    },
    [selectedContentType]
  );

  const renderModalContent = () => {
    if (error) {
      return (
        <Modal.Content>
          <Box paddingTop="spacingL" paddingBottom="spacingL">
            <ErrorMessage errorMessage={errorMessage} fontColor="gray700" hasOutlineIcon={false} />
          </Box>
        </Modal.Content>
      );
    }

    const pinnedContentTypes: ContentTypeProps[] = contentTypes.filter(
      (c) => c.sys.id === selectedContentType.contentTypeId
    );

    if (contentTypes.length) {
      return (
        <>
          <Modal.Content>
            <FormControl as="fieldset" marginBottom="none">
              <DebouncedSearchInput
                placeholder={searchPlaceholder}
                onChange={handleSearchQueryUpdate}
              />
              <Table className={styles.table}>
                <Table.Body>
                  <SearchableList
                    items={contentTypes}
                    pinnedItems={pinnedContentTypes}
                    renderListItem={renderRow}
                    searchQuery={searchQuery}
                    searchKeys={['sys.id', 'displayField', 'name', 'description']}
                  />
                </Table.Body>
              </Table>
            </FormControl>
          </Modal.Content>
          <Modal.Controls>
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                handleNotificationEdit(selectedContentType);
                onClose();
              }}
              isDisabled={!selectedContentType}>
              {button}
            </Button>
          </Modal.Controls>
        </>
      );
    }

    return (
      <Modal.Content>
        <DebouncedSearchInput placeholder={searchPlaceholder} disabled={true} />
        <EmptyState
          image={<WebApp />}
          heading={emptyHeading}
          body={emptyContent}
          linkSubstring={link}
          linkHref={contentTypeConfigLink}
        />
      </Modal.Content>
    );
  };

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <ModalHeader title={title} onClose={onClose} />
          {renderModalContent()}
        </>
      )}
    </Modal>
  );
};

export default ContentTypeSelectionModal;
