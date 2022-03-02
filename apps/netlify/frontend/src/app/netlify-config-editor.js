import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/f36-tokens';
import {
  Heading,
  Paragraph,
  Button,
  Text,
  TextLink,
  Subheading,
} from '@contentful/f36-components';
import {
  PlusIcon,
  DoneIcon,
} from '@contentful/f36-icons';

import { MAX_CONFIGS } from '../constants';
import { EditSiteModal } from './edit-site-modal';

const styles = {
  container: css({
    margin: `${tokens.spacingXl} 0`,
  }),
  row: css({
    display: 'flex',
    marginBottom: tokens.spacingM,
    paddingBottom: tokens.spacingM,
    borderBottom: `1px solid ${tokens.gray200}`,
    alignItems: 'center',
    '&:last-child': css({
      marginBottom: tokens.spacingL,
      paddingBottom: 0,
      borderBottom: 0,
    }),
  }),
  site: css({
    flexGrow: 1,
  }),
  deploysState: css({
    display: 'flex',
    marginRight: tokens.spacingM,
    alignItems: 'center',
    color: tokens.gray600,
  }),
  editBtn: css({
    margin: `0 ${tokens.spacingM}`,
  }),
};

const NetlifyConfigEditor = ({ disabled, siteConfigs, netlifySites, contentTypes, onSiteConfigsChange }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const editingSiteIndex = useRef(null);

  const onAdd = () => {
    editingSiteIndex.current = null;
    setIsModalVisible(true);
  };

  const onEdit = (configIndex) => {
    editingSiteIndex.current = configIndex;
    setIsModalVisible(true);
  };

  const onRemove = (configIndex) => {
    const updated = siteConfigs.filter((_, i) => i !== configIndex);
    onSiteConfigsChange(updated);
  };

  const onCloseModal = () => {
    editingSiteIndex.current = null;
    setIsModalVisible(false);
  };

  return (
    <>
      <div className={styles.container}>
        <Heading>Configure Netlify sites</Heading>
        {disabled ? (
          <Paragraph marginBottom="spacingL" fontColor="gray700">Requires a Netlify account.</Paragraph>
        ) : (
          <Paragraph marginBottom="spacingL" fontColor="gray700">
            Pick the Netlify site(s) you want to enable a build for. Only sites with continuous deployment configured can be configured.
          </Paragraph>
        )}
        <div>
          {siteConfigs.map((siteConfig, configIndex) => (
            <div key={configIndex} className={styles.row}>
              <div className={styles.site}>
                <Subheading marginBottom={0}>{siteConfig.name}</Subheading>
                <Text fontColor="gray600">{siteConfig.netlifySiteName}</Text>
              </div>
              {siteConfig.selectedContentTypes?.length > 0 && (
                <div className={styles.deploysState}>
                  <DoneIcon variant="secondary" size="tiny" />
                  <Text fontColor="gray600">Automatic deploys</Text>
                </div>
              )}
              <TextLink
                className={styles.editBtn}
                variant="primary"
                isDisabled={disabled}
                onClick={() => onEdit(configIndex)}
              >
                Edit
              </TextLink>
              <TextLink
                variant="negative"
                isDisabled={disabled}
                onClick={() => onRemove(configIndex)}
              >
                Remove
              </TextLink>
            </div>
          ))}
        </div>
        <Button
          isDisabled={disabled || siteConfigs.length >= MAX_CONFIGS}
          variant={siteConfigs.length > 0 ? 'secondary' : 'primary'}
          startIcon={<PlusIcon />}
          size="small"
          onClick={onAdd}
        >
          {`Add ${siteConfigs.length > 0 ? 'another ' : ''}site`}
        </Button>
      </div>
      <EditSiteModal
        configIndex={editingSiteIndex.current}
        siteConfigs={siteConfigs}
        netlifySites={netlifySites}
        contentTypes={contentTypes}
        isShown={isModalVisible}
        onSiteConfigsChange={onSiteConfigsChange}
        onClose={onCloseModal}
      />
    </>
  );
}

NetlifyConfigEditor.propTypes = {
  disabled: PropTypes.bool.isRequired,
  siteConfigs: PropTypes.array.isRequired,
  netlifySites: PropTypes.array.isRequired,
  onSiteConfigsChange: PropTypes.func.isRequired,
};

export default NetlifyConfigEditor;
