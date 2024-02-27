import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Modal,
  Radio,
  Table,
} from '@contentful/f36-components';
import { contentTypeSelection } from '@constants/configCopy';
import { styles } from './ContentTypeSelectionModal.styles';
import { Notification } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import { ContentTypeProps } from 'contentful-management';
import EmptyState from '@components/config/EmptyState/EmptyState';
import WebApp from '@components/config/EmptyState/WebApp';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import { TextInput } from '@contentful/f36-components';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
import { SearchIcon } from '@contentful/f36-icons';

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
  const [filteredContentTypes, setFilteredContentTypes] =
    useState<ContentTypeProps[]>(contentTypes);

  const { title, button, link, emptyContent, emptyHeading, errorMessage, searchPlaceholder } =
    contentTypeSelection.modal;

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      // revert to default full list of available contentTypes
      setFilteredContentTypes(contentTypes);
      return;
    }

    const fuseOptions = {
      isCaseSensitive: false,
      keys: ['sys.id', 'displayField', 'name', 'description'],
    };

    const fuse = new Fuse(filteredContentTypes, fuseOptions);
    const searchPattern = e.target.value;
    const fuseSearchResultObj = fuse.search(searchPattern);
    // extract actual contentType objects from fuse search result object;
    const extractedSearchResults = fuseSearchResultObj.map((result) => result.item);

    setFilteredContentTypes(extractedSearchResults);
  }, []);

  const debouncedHandleSearchUpdate = useMemo(() => debounce(handleSearch, 1000), []);

  const renderModalContent = () => {
    if (error) {
      return (
        <Modal.Content>
          <ErrorMessage errorMessage={errorMessage} />
        </Modal.Content>
      );
    }

    if (filteredContentTypes.length) {
      return (
        <>
          <Modal.Content>
            <FormControl as="fieldset" marginBottom="none">
              <Box marginBottom="spacingM">
                <TextInput.Group>
                  <TextInput
                    placeholder={searchPlaceholder}
                    onChange={debouncedHandleSearchUpdate}
                  />
                  <IconButton
                    variant="secondary"
                    icon={<SearchIcon />}
                    aria-label="magnifying glass icon"
                  />
                </TextInput.Group>
              </Box>
              <Table className={styles.table}>
                <Table.Body>
                  {filteredContentTypes.map((contentType) => (
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
                  ))}
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
