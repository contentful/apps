import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Menu, TextLink } from '@contentful/f36-components';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { GlobalStateContext } from './all-context';
import { LinkIcon, PlusIcon } from '@contentful/f36-icons';

const styles = {
  container: css({
    marginTop: tokens.spacingM,
  }),
  item: css({
    marginBottom: tokens.spacingXs,
  }),
};

export default function VariationSelect(props) {
  const [state] = useContext(GlobalStateContext);

  const linkContentTypes = state.referenceInfo.linkContentTypes || [];
  const linkContentTypeNames = state.referenceInfo.linkContentTypeNames || [];

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <Menu>
          <Menu.Trigger>
            <TextLink isDisabled={props.disableEdit} icon={<PlusIcon />}>
              Create entry and link
            </TextLink>
          </Menu.Trigger>
          <Menu.List maxHeight={300}>
            <Menu.SectionTitle isTitle>Select content type</Menu.SectionTitle>
            {linkContentTypes.map((value, index) => (
              <Menu.Item
                key={value}
                onClick={() => {
                  props.onCreate(value);
                }}>
                {linkContentTypeNames[index]}
              </Menu.Item>
            ))}
          </Menu.List>
        </Menu>
      </div>
      <div className={styles.item}>
        <TextLink
          disabled={props.disableEdit}
          icon={<LinkIcon />}
          onClick={props.onLinkExistingClick}>
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
