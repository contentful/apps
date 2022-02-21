import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import {
  Typography,
  Heading,
  Paragraph,
  Button,
  TextLink,
  Subheading,
} from '@contentful/forma-36-react-components';

import { MAX_CONFIGS } from '../constants';
import { EditSiteModal } from './EditSiteModal';

const styles = {
  container: css({
    margin: `${tokens.spacingXl} 0`,
  }),
  row: css({
    display: 'flex',
    marginBottom: tokens.spacingM,
    paddingBottom: tokens.spacingM,
    borderBottom: `1px solid ${tokens.gray200}`,
    '&:last-child': css({
      marginBottom: tokens.spacingL,
      paddingBottom: 0,
      borderBottom: 0,
    }),
  }),
  site: css({
    flexGrow: 1,
  }),
  siteName: css({
    marginBottom: 0,
  }),
  netlifySiteName: css({
    marginBottom: 0,
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
      <Typography className={styles.container}>
        <Heading>Configure Netlify sites</Heading>
        {disabled ? (
          <Paragraph marginBottom={tokens.spacingL}>Requires a Netlify account.</Paragraph>
        ) : (
          <Paragraph marginBottom={tokens.spacingL}>
            Pick the Netlify site(s) you want to enable a build for. Only sites with continuous deployment configured can be configured.
          </Paragraph>
        )}
        <div>
          {siteConfigs.map((siteConfig, configIndex) => {
            return (
              <div key={configIndex} className={styles.row}>
                <div className={styles.site}>
                  <Subheading className={styles.siteName}>{siteConfig.name}</Subheading>
                  <Paragraph className={styles.netlifySiteName}>{siteConfig.netlifySiteName}</Paragraph>
                </div>
                <div>Automatic deploys</div>
                <TextLink
                  className={styles.editBtn}
                  linkType="primary"
                  disabled={disabled}
                  onClick={() => onEdit(configIndex)}
                >
                  Edit
                </TextLink>
                <TextLink
                  linkType="negative"
                  disabled={disabled}
                  onClick={() => onRemove(configIndex)}
                >
                  Remove
                </TextLink>
              </div>
            );
          })}
        </div>
        <Button
          disabled={disabled || siteConfigs.length >= MAX_CONFIGS}
          buttonType="muted"
          icon="Plus"
          onClick={onAdd}
        >
          Add another site
        </Button>
      </Typography>
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
