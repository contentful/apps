import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import { VARIATION_CONTAINER_ID } from './constants';
import { css } from 'emotion';
import RefToolTip from './RefToolTip';

import { Checkbox } from '@contentful/f36-components';

const styles = {
  container: css({
    position: 'relative',
    marginRight: '0.5rem',
  }),
};

ReferenceField.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  contentType: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default function ReferenceField({ id, checked, contentType, onSelect }) {
  const field = findFieldById(id, contentType);
  const disabled = !hasFieldLinkValidations(field);

  return (
    <div className={styles.container}>
      <Checkbox
        id={`reference-field-${id}`}
        isDisabled={disabled}
        isChecked={checked || disabled}
        onChange={(e) => onSelect(e.target.checked)}
      >
        {field.name}
      </Checkbox>
      {disabled ? <RefToolTip /> : null}
    </div>
  );
}

export function findFieldById(id, contentType) {
  return contentType.fields.find((field) => field.id === id);
}

export function getFieldLinkValidations(field) {
  return get(field, ['items', 'validations'], field.validations).filter((v) => v.linkContentType);
}

export function getNonFieldLinkValidations(field) {
  return get(field, ['items', 'validations'], field.validations).filter((v) => !v.linkContentType);
}

export function hasFieldLinkValidations(field) {
  return getFieldLinkValidations(field).length > 0;
}

export function hasVariationContainerInFieldLinkValidations(field) {
  if (!hasFieldLinkValidations(field)) return false;

  let linkContentTypeValidations = getFieldLinkValidations(field)[0].linkContentType;
  if (typeof linkContentTypeValidations === 'string') {
    linkContentTypeValidations = [linkContentTypeValidations];
  }

  if (!Array.isArray(linkContentTypeValidations)) {
    linkContentTypeValidations = [];
  }

  return linkContentTypeValidations.includes(VARIATION_CONTAINER_ID);
}
