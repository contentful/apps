import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Menu, TextLink } from '@contentful/f36-components';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { GlobalStateContext } from './all-context';
import { PlusIcon } from '@contentful/f36-icons';

const styles = {
  container: css({
    marginTop: tokens.spacingM,
  }),
  item: css({
    marginBottom: tokens.spacingXs,
  }),
};

export default function VariationSelect(props) {
  const [isDropdownShown, setShowDropdown] = useState(false);
  const [state] = useContext(GlobalStateContext);

  const linkContentTypes = state.referenceInfo.linkContentTypes || [];
  const linkContentTypeNames = state.referenceInfo.linkContentTypeNames || [];

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <Menu
          isOpen={isDropdownShown}
          onClose={() => {
            setShowDropdown(false);
          }}>
          <Menu.Trigger>
            <TextLink
              isDisabled={props.disableEdit}
              icon={<PlusIcon />}
              onClick={() => {
                setShowDropdown(true);
              }}>
              Create entry and link
            </TextLink>
          </Menu.Trigger>
          <Menu.List maxHeight={300}>
            <Menu.SectionTitle isTitle>Select content type</Menu.SectionTitle>
            {linkContentTypes.map((value, index) => (
              <Menu.ListItem
                key={value}
                onClick={() => {
                  props.onCreate(value);
                  setShowDropdown(false);
                }}>
                {linkContentTypeNames[index]}
              </Menu.ListItem>
            ))}
          </Menu.List>
        </Menu>
      </div>
      <div className={styles.item}>
        <TextLink disabled={props.disableEdit} icon="Link" onClick={props.onLinkExistingClick}>
          Link an existing entry
        </TextLink>
      </div>
    </div>
  );
}

VariationSelect.propTypes = {
  disableEdit: PropTypes.bool.isRequired,
  onLinkExistingClick: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
