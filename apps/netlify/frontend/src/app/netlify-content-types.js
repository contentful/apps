import React from 'react';
import PropTypes from 'prop-types';

import {
  Note,
  Text,
  TextLink,
  Heading,
  Paragraph,
  Checkbox,
} from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const styles = {
  selectAllCheckbox: css({
    marginBottom: tokens.spacingXs,
  }),
  checkboxLabel: css({
    fontWeight: 400,
  }),
};

const SELECT_ALL_CHECKBOX = 'selectAll';

const NetlifyContentTypes = ({
  contentTypes,
  enabledContentTypes,
  onEnabledContentTypesChange,
  disabled,
  space,
  environment,
}) => {
  const allSelected = contentTypes.length === enabledContentTypes.length;

  const onChange = (e) => {
    const isChecked = e.target.checked;
    const id = e.target.value;
    let changed = [];

    if (id === SELECT_ALL_CHECKBOX) {
      changed = allSelected ? [] : contentTypes.map(([id]) => id);
    } else {
      changed = isChecked ? enabledContentTypes.concat([id]) : enabledContentTypes.filter((cur) => cur !== id);
    }

    onEnabledContentTypesChange(changed);
  };

  return (
    <>
      <Heading>Assign to sidebars</Heading>
      <Paragraph>
        Select which content types will show the Netlify functionality in the sidebar.
      </Paragraph>
      {contentTypes.length === 0 ? (
        <Note variant="warning">
          There are <strong>no content types</strong> in this environment. You can add a{' '}
          <TextLink
            variant="primary"
            target="_blank"
            rel="noopener noreferrer"
            href={
              environment === 'master'
                ? `https://app.contentful.com/spaces/${space}/content_types`
                : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
            }
          >
            content type
          </TextLink>{' '}
          and assign it to the app from this screen.
        </Note>
      ) : (
        <Checkbox.Group onChange={onChange} value={allSelected ? [SELECT_ALL_CHECKBOX, ...enabledContentTypes] : enabledContentTypes}>
          <Checkbox
            id={SELECT_ALL_CHECKBOX}
            value={SELECT_ALL_CHECKBOX}
            isDisabled={disabled}
            className={styles.selectAllCheckbox}
          >
            Select all
          </Checkbox>
          {contentTypes.map(([id, name]) => (
            <Checkbox
              key={id}
              id={`ct-box-${id}`}
              value={id}
              isDisabled={disabled}
            >
              <Text className={styles.checkboxLabel}>{name}</Text>
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </>
  );
};

NetlifyContentTypes.propTypes = {
  disabled: PropTypes.bool.isRequired,
  space: PropTypes.string.isRequired,
  environment: PropTypes.string.isRequired,
  contentTypes: PropTypes.array.isRequired,
  enabledContentTypes: PropTypes.array.isRequired,
  onEnabledContentTypesChange: PropTypes.func.isRequired,
};

export default NetlifyContentTypes;
