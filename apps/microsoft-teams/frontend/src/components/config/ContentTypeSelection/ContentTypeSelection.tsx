import { useContext, useState } from 'react';
import { Box, Flex, IconButton, ModalLauncher, Text, TextInput } from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ContentTypeSelectionModal from '@components/config/ContentTypeSelectionModal/ContentTypeSelectionModal';
import ContentfulLogo from '@components/config/ContentfulLogo/ContentfulLogo';
import { contentTypeSelection } from '@constants/configCopy';
import { Notification } from '@customTypes/configPage';
import { EditIcon } from '@contentful/f36-icons';
import { styles } from './ContentTypeSelection.styles';
import { getContentTypeName } from '@helpers/configHelpers';
import { ContentTypeContext } from '@context/ContentTypeProvider';

interface Props {
  notification: Notification;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
}

const ContentTypeSelection = (props: Props) => {
  const { notification, handleNotificationEdit } = props;
  const [areContentTypesLoading, setAreContentTypesLoading] = useState<boolean>(false);
  const { contentTypes, contentTypesLoading, contentTypesError, contentTypeConfigLink } =
    useContext(ContentTypeContext);

  const openContentTypeSelectionModal = () => {
    if (contentTypesLoading != areContentTypesLoading) {
      setAreContentTypesLoading(contentTypesLoading);
      return;
    } else if (!areContentTypesLoading)
      return ModalLauncher.open(({ isShown, onClose }) => (
        <ContentTypeSelectionModal
          isShown={isShown}
          onClose={() => {
            onClose(true);
          }}
          handleNotificationEdit={handleNotificationEdit}
          savedContentTypeId={notification.contentTypeId}
          contentTypes={contentTypes}
          contentTypeConfigLink={contentTypeConfigLink}
          error={Boolean(contentTypesError)}
        />
      ));
  };

  return (
    <Box marginBottom="spacingL">
      <Flex marginBottom="spacingS" alignItems="center">
        <ContentfulLogo />
        <Text marginLeft="spacingXs" marginBottom="none" fontWeight="fontWeightMedium">
          {contentTypeSelection.title}
        </Text>
      </Flex>
      {notification.contentTypeId ? (
        <TextInput.Group>
          <TextInput
            id="selected-content-type"
            isDisabled={true}
            value={getContentTypeName(
              notification.contentTypeId,
              contentTypes,
              contentTypeSelection.notFound
            )}
            className={styles.input}
          />
          <IconButton
            variant="secondary"
            icon={<EditIcon />}
            onClick={openContentTypeSelectionModal}
            aria-label="Change selected content type"
            isLoading={contentTypesLoading}
          />
        </TextInput.Group>
      ) : (
        <AddButton
          buttonCopy={contentTypeSelection.addButton}
          handleClick={openContentTypeSelectionModal}
          isLoading={contentTypesLoading}
        />
      )}
    </Box>
  );
};

export default ContentTypeSelection;
