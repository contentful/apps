import { useState } from 'react';
import { Button, FormControl, Modal, Radio, Table } from '@contentful/f36-components';
import { contentTypeSelection } from '@constants/configCopy';
import { styles } from './ContentTypeSelectionModal.styles';
import { Notification } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import { ContentTypeProps } from 'contentful-management';
import EmptyState from '@components/config/EmptyState/EmptyState';
import WebApp from '@components/config/EmptyState/WebApp';
import DebouncedSearchInput from '@components/config/DebouncedSearchInput/DebouncedSearchInput';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import SearchableList from '../SearchableList/SearchableList';

interface Props {
  isShown: boolean;
  onClose: () => void;
  savedContentTypeId: string;
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
    handleNotificationEdit,
    contentTypes,
    contentTypeConfigLink,
    error,
  } = props;

  const [selectedContentTypeId, setSelectedContentTypeId] = useState(savedContentTypeId ?? '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { title, button, link, emptyContent, emptyHeading, errorMessage, searchPlaceholder } =
    contentTypeSelection.modal;

  /**
   * The search input and the list of content types must be kept separate so that the rerendering
   * of the list does unnecessarily re-render input (and lose focus/state). So we are maintaining
   * search query in this component that is received from <DebouncedSearchInput> and passing it
   * to <SearchableList>
   */
  const handleSearchQueryUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const renderRow = (contentType: ContentTypeProps) => {
    return (
      <Table.Row
        key={contentType.sys.id}
        onClick={() => setSelectedContentTypeId(contentType.sys.id)}
        className={styles.tableRow}>
        <Table.Cell>
          <Radio
            id={contentType.sys.id}
            isChecked={selectedContentTypeId === contentType.sys.id}
            onChange={() => {
              /* clicking entire row checks this radio, i.e. do nothing here */
            }}>
            {contentType.name}
          </Radio>
        </Table.Cell>
      </Table.Row>
    );
  };

  const renderModalContent = () => {
    if (error) {
      return (
        <Modal.Content>
          <ErrorMessage errorMessage={errorMessage} />
        </Modal.Content>
      );
    }

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
                    list={contentTypes}
                    searchQuery={searchQuery}
                    renderListItem={renderRow}
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
                handleNotificationEdit({ contentTypeId: selectedContentTypeId });
                onClose();
              }}
              isDisabled={!selectedContentTypeId}>
              {button}
            </Button>
          </Modal.Controls>
        </>
      );
    }

    return (
      <Modal.Content>
        <DebouncedSearchInput
          placeholder={searchPlaceholder}
          onChange={handleSearchQueryUpdate}
          disabled={true}
        />
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
