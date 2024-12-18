import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import { Checkbox, FormControl } from '@contentful/f36-components';
import { VARIATION_CONTAINER_ID } from './constants';
import { css } from '@emotion/css';
import RefToolTip from './RefToolTip';

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
      <FormControl id={`reference-field-${id}`}>
        <FormControl.Label htmlFor={`reference-field-${id}`}>{field.name}</FormControl.Label>
        <Checkbox
          isChecked={checked || disabled}
          isDisabled={disabled}
          onChange={(e) => onSelect(e.target.checked)}
        />
      </FormControl>

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
