import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  SelectField,
  TextField,
  Button,
  Option,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  controls: css({
    justifyContent: 'flex-end',
  }),
};

const PICK_OPTION_VALUE = '__pick__';

export const EditSiteModal = ({ configIndex, siteConfigs, netlifySites, isShown, onSiteConfigsChange, onClose }) => {
  const [siteId, setSiteId] = useState(PICK_OPTION_VALUE);
  const [displayName, setDisplayName] = useState('');
  const isNewSite = configIndex === undefined || configIndex === null;

  const selectId = `site-select-${configIndex ?? 'new'}`;
  const inputId = `site-input-${configIndex ?? 'new'}`;

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

  const onDisplayNameChange = (e) => {
    setDisplayName(e.target.value);
  };

  const onSiteChange = (e) => {
    setSiteId(e.target.value);
  };

  const resetFields = () => {
    setSiteId(PICK_OPTION_VALUE);
    setDisplayName('');
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
                onChange={onSiteChange}
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
                onChange={onDisplayNameChange}
                required
              />
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
