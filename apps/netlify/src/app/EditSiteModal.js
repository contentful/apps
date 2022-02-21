import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  SelectField,
  TextField,
  Button,
  Option,
  CheckboxField,
  Pill,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  controls: css({
    justifyContent: 'flex-end',
  }),
  pill: css({
    margin: `${tokens.spacingXs} ${tokens.spacingXs} 0 0`,
  }),
  contentTypeSelect: css({
    marginLeft: tokens.spacingL,
  }),
};

const PICK_OPTION_VALUE = '__pick__';
const PICK_CONTENT_TYPE = '__select-content-type__';

export const EditSiteModal = ({
  configIndex,
  siteConfigs,
  netlifySites,
  contentTypes,
  isShown,
  onSiteConfigsChange,
  onClose
}) => {
  const [siteId, setSiteId] = useState(PICK_OPTION_VALUE);
  const [displayName, setDisplayName] = useState('');
  const [isDeploysOn, setIsDeploysOn] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState({});

  const isNewSite = configIndex === undefined || configIndex === null;

  const selectId = `site-select-${configIndex ?? 'new'}`;
  const inputId = `site-input-${configIndex ?? 'new'}`;
  const deploysId = `deploys-checkbox-${configIndex ?? 'new'}`;
  const contentTypeSelectId = `content-type-select-${configIndex ?? 'new'}`;

  const updateSiteData = (selectedSite) => {
    return {
      name: displayName,
      netlifySiteId: selectedSite.id,
      netlifySiteName: selectedSite.name,
      netlifySiteUrl: selectedSite.ssl_url || selectedSite.url,
    };
  };

  const updateConfig = () => {
    const selectedSite = netlifySites.find((netlifySite) => netlifySite.id === siteId) || {};

    if (isNewSite) {
      onSiteConfigsChange([...siteConfigs, updateSiteData(selectedSite)]);
    } else {
      const updated = siteConfigs.map((siteConfig, index) => {
        if (index === configIndex) {
          return {
            ...siteConfig,
            ...updateSiteData(selectedSite),
          };
        }

        return siteConfig;
      });
      onSiteConfigsChange(updated);
    }
  };

  const resetFields = () => {
    setSiteId(PICK_OPTION_VALUE);
    setDisplayName('');
    setSelectedContentTypes({});
  };

  const onConfirm = () => {
    updateConfig();
    onClose();
    resetFields();
  };

  const onCancel = () => {
    onClose();
    resetFields();
  };

  const onSelectContentType = (e) => {
    const selected = contentTypes.find(([id, name]) => id === e.target.value);
    if (selected) {
      setSelectedContentTypes({...selectedContentTypes, ...{ [selected[0]]: selected[1] } });
    }
  };

  const onRemoveContentType = (ctId) => {
    const filtered = {};
    
    Object.keys(selectedContentTypes).forEach((id) => {
      if (id !== ctId) {
        filtered[id] = selectedContentTypes[id];
      }
    });

    setSelectedContentTypes(filtered);
  };

  const renderAvailableContentTypes = () => {
    if (!contentTypes) {
      return null;
    }

    return contentTypes
      .filter(([id, _]) => !Object.keys(selectedContentTypes).includes(id))
      .map(([id, name]) => (
        <Option key={id} value={id}>{name}</Option>
      ));
  };

  const renderSelectedContentTypes = () => {
    return Object.entries(selectedContentTypes).map(([id, name]) => (
      <Pill key={id} label={name} className={styles.pill} onClose={() => onRemoveContentType(id)} />
    ));
  };

  useEffect(() => {
    if (!isNewSite) {
      const siteConfig = siteConfigs[configIndex];

      if (siteConfig?.name) {
        setDisplayName(siteConfig.name);
      }

      setSiteId(siteConfig.netlifySiteId);
    }
  }, [configIndex, isNewSite, siteConfigs]);

  return (
    <Modal isShown={isShown} onClose={onCancel} size="small">
      {() => (
        <>
          <Modal.Header title={isNewSite ? 'Add site' : 'Edit site'} />
          <Modal.Content>
            <Form onSubmit={onConfirm} spacing="default">
              <SelectField
                id={selectId}
                name={selectId}
                labelText="Netlify site"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
              >
                {isNewSite && (
                  <Option value={PICK_OPTION_VALUE}>Pick site</Option>
                )}
                {netlifySites.length > 0 && netlifySites.map((netlifySite) => {
                  return (
                    <Option key={netlifySite.id} value={netlifySite.id}>
                      {netlifySite.name}
                    </Option>
                  );
                })}
              </SelectField>
              <TextField
                id={inputId}
                name={inputId}
                labelText="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <CheckboxField
                id={deploysId}
                name={deploysId}
                checked={isDeploysOn}
                labelText="Automatic deploys on publish events"
                helpText="Rebuild site when an entry of matching content types or assets are published or unpublished."
                onChange={(e) => setIsDeploysOn(e.target.checked)}
              />
              {isDeploysOn && (
                <>
                  <Select
                    id={contentTypeSelectId}
                    name={contentTypeSelectId}
                    value={PICK_CONTENT_TYPE}
                    className={styles.contentTypeSelect}
                    width="auto"
                    onChange={onSelectContentType}
                  >
                    <Option value={PICK_CONTENT_TYPE} disabled>Select content types...</Option>
                    <Option value="*">All</Option>
                    {renderAvailableContentTypes(contentTypes)}
                  </Select>
                  {renderSelectedContentTypes()}
                </>
              )}
            </Form>
          </Modal.Content>
          <Modal.Controls className={styles.controls}>
            <Button buttonType="muted" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button buttonType="positive" size="small" onClick={onConfirm} disabled={!siteId || !displayName.trim()}>
              Confirm
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
