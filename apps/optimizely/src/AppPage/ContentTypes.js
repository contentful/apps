import React, { useState } from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { VARIATION_CONTAINER_ID } from './constants';
import { hasReferenceFieldsLinkingToEntry } from './ReferenceForm';
import { css } from 'emotion';
import ReferenceField, { hasFieldLinkValidations } from './ReferenceField';
import RefToolTip from './RefToolTip';

import {
  Button,
  Modal,
  FormControl,
  Select,
  Table,
  TextLink,
  Heading,
  Paragraph,
  SectionHeading,
} from '@contentful/f36-components';

const styles = {
  table: css({
    marginTop: tokens.spacingL,
  }),
  link: css({
    marginRight: tokens.spacingS,
  }),
  contentTypeRow: css({
    gridTemplateColumns: 'auto 6rem',
  }),
  refList: css({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }),
  sectionHeading: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingM,
  }),
};

ContentTypes.propTypes = {
  addedContentTypes: PropTypes.array.isRequired,
  allContentTypes: PropTypes.array.isRequired,
  allReferenceFields: PropTypes.object.isRequired,
  onAddContentType: PropTypes.func.isRequired,
  onDeleteContentType: PropTypes.func.isRequired,
};

function isContentTypeValidSelection(contentType, addedContentTypes, isEditMode) {
  const { id } = contentType.sys;
  return (
    id !== VARIATION_CONTAINER_ID &&
    hasReferenceFieldsLinkingToEntry(contentType) &&
    (isEditMode || !addedContentTypes.includes(id))
  );
}

export default function ContentTypes({
  addedContentTypes,
  allContentTypes,
  allReferenceFields,
  onAddContentType,
  onDeleteContentType,
}) {
  const [selectedContentType, selectContentType] = useState('');
  const [selectedReferenceFields, selectRef] = useState({});
  const [modalOpen, toggleModal] = useState(false);
  const [isEditMode, setEditMode] = useState(false);

  const contentType = allContentTypes.find((ct) => ct.sys.id === selectedContentType);
  let referenceFields = [];
  let checkedFields = {};

  const addableContentTypes = allContentTypes.filter((ct) =>
    isContentTypeValidSelection(ct, addedContentTypes, isEditMode)
  );

  if (contentType) {
    referenceFields = contentType.fields
      .filter(
        (field) =>
          field.linkType === 'Entry' || (field.type === 'Array' && field.items.linkType === 'Entry')
      )
      .map((ref) => ref.id);

    checkedFields = referenceFields.reduce((acc, id) => {
      const checkedReferences = {
        ...allReferenceFields[selectedContentType],
        ...selectedReferenceFields,
      };

      if (checkedReferences) {
        return { ...acc, [id]: checkedReferences[id] || false };
      }

      return { ...acc, [id]: false };
    }, {});
  }

  const onSelectReferenceField = (fields) => {
    selectRef({ ...selectedReferenceFields, ...fields });
  };

  const onSelectContentType = (ctId) => {
    selectRef({});
    selectContentType(ctId);
  };

  const closeModal = () => {
    // reset state
    onSelectReferenceField({});
    onSelectContentType('');
    setEditMode(false);
    toggleModal(false);
  };

  const addContentTypeCloseModal = () => {
    const update = { ...allReferenceFields[selectedContentType], ...selectedReferenceFields };

    if (!Object.keys(update).length) {
      closeModal();
      return;
    }

    onAddContentType({ [selectedContentType]: update });
    closeModal();
  };

  const onEdit = (ctId) => {
    setEditMode(true);
    onSelectContentType(ctId);
    toggleModal(true);
  };

  return (
    <>
      <React.Fragment>
        <Heading>Content types</Heading>
        <Paragraph>Select the content types for which you want to enable A/B testing</Paragraph>
        <Button
          variant="secondary"
          onClick={() => toggleModal(true)}
          isDisabled={!addableContentTypes.length}
          testId="add-content"
        >
          Add content type
        </Button>
        {addedContentTypes.length > 0 ? (
          <Table className={styles.table}>
            <tbody>
              {addedContentTypes.map((id) => (
                <ContentTypeRow
                  key={id}
                  contentTypeId={id}
                  allContentTypes={allContentTypes}
                  allReferenceFields={allReferenceFields}
                  onClickDelete={onDeleteContentType}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </Table>
        ) : null}
      </React.Fragment>
      <Modal title="Add content type" isShown={modalOpen} onClose={closeModal}>
        {({ title, onClose }) => (
          <React.Fragment>
            <Modal.Header title={title} onClose={onClose} />
            <Modal.Content>
              <React.Fragment>
                <Paragraph>
                  Select the content type and the reference fields you want to enable for
                  experimentation. You&rsquo;ll be able to change this later.
                </Paragraph>
                <FormControl
                  id="content-types"
                  isRequired
                  testId="content-type-selector"
                  isDisabled={isEditMode}
                >
                  <FormControl.Label>Content Type</FormControl.Label>
                  <Select
                    name="content-types"
                    value={selectedContentType || ''}
                    onChange={(e) => onSelectContentType(e.target.value)}
                    width="medium"
                  >
                    <Select.Option value="" disabled>
                      Select content type
                    </Select.Option>
                    {addableContentTypes.map((ct) => (
                      <Select.Option key={ct.sys.id} value={ct.sys.id}>
                        {ct.name}
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>
                {referenceFields.length > 0 && (
                  <>
                    <SectionHeading className={styles.sectionHeading}>
                      Reference Fields
                    </SectionHeading>
                    <div className={styles.refList}>
                      {referenceFields.map((field) => (
                        <ReferenceField
                          key={field}
                          contentType={contentType}
                          id={field}
                          checked={checkedFields[field] || selectedReferenceFields[field]}
                          onSelect={(checked) => onSelectReferenceField({ [field]: checked })}
                          testId="reference-field"
                        />
                      ))}
                    </div>
                  </>
                )}
              </React.Fragment>
            </Modal.Content>
            <Modal.Controls>
              <Button
                isDisabled={!selectedContentType}
                onClick={addContentTypeCloseModal}
                variant="positive"
              >
                Save
              </Button>
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    </>
  );
}

ContentTypeRow.propTypes = {
  contentTypeId: PropTypes.string.isRequired,
  allContentTypes: PropTypes.array.isRequired,
  allReferenceFields: PropTypes.object.isRequired,
  onClickDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function ContentTypeRow({
  contentTypeId,
  allContentTypes,
  allReferenceFields,
  onClickDelete,
  onEdit,
}) {
  const contentType = allContentTypes.find((ct) => ct.sys.id === contentTypeId);
  const referenceFields = allReferenceFields[contentTypeId];
  const referenceFieldIds = Object.keys(referenceFields);
  const referencesToShow = referenceFieldIds.filter((id) => referenceFields[id]);

  if (!referencesToShow.length) {
    return null;
  }

  // if any references are disabled, we should not allow for the delete button
  let anyDisabled = false;

  return (
    <Table.Row>
      <Table.Cell className={styles.contentTypeRow}>
        <strong>{contentType.name}</strong>
      </Table.Cell>
      <Table.Cell className={styles.contentTypeRow}>
        {referencesToShow.map((id) => {
          const field = contentType.fields.find((f) => f.id === id) || {};
          const disabled = !hasFieldLinkValidations(field);

          if (disabled) {
            anyDisabled = true;
          }

          return (
            <div key={id}>
              {field.name} {disabled && <RefToolTip />}
            </div>
          );
        })}
      </Table.Cell>
      <Table.Cell className={styles.contentTypeRow}>
        <TextLink as="button" onClick={() => onEdit(contentTypeId)} className={styles.link}>
          Edit
        </TextLink>
        {!anyDisabled && (
          <TextLink
            as="button"
            onClick={() => onClickDelete(contentTypeId)}
            className={styles.link}
            variant="negative"
          >
            Delete
          </TextLink>
        )}
      </Table.Cell>
    </Table.Row>
  );
}
