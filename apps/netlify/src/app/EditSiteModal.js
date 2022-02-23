import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  SelectField,
  TextField,
  Button,
  Option,
  CheckboxField,
  Pill,
  Autocomplete,
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
  const [availableContentTypes, setAvailableContentTypes] = useState([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);
  const [contentTypeQuery, setContentTypeQuery] = useState('');

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
      selectedContentTypes: isDeploysOn ? selectedContentTypes.map((contentType) => contentType.value) : undefined,
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
    setSelectedContentTypes([]);
    setIsDeploysOn(false);
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

  const onSelectContentType = (item) => {
    const selected = availableContentTypes.find((contentType) => contentType.value === item.value);
    if (selected) {
      setSelectedContentTypes([...selectedContentTypes, { value: selected.value, label: selected.label } ]);
    }
  };

  const onContentTypeQueryChange = (query) => {
    if (typeof query === 'string') {
      setContentTypeQuery(query);
    }
  };

  const onRemoveContentType = (ctId) => {
    const filtered = selectedContentTypes.filter((contentType) => contentType.value !== ctId);
    setSelectedContentTypes(filtered);
  };

  const renderSelectedContentTypes = () => {
    return selectedContentTypes.map(({ value, label }) => (
      <Pill key={value} label={label} className={styles.pill} onClose={() => onRemoveContentType(value)} />
    ));
  };

  const getAvailableContentTypes = useCallback(() => {
    return contentTypes
      .filter(([id, _]) => !selectedContentTypes.some((contentType) => contentType.value === id))
      .filter(([_, name]) => contentTypeQuery ? new RegExp(contentTypeQuery, 'i').test(name) : true)
      .map(([id, name]) => ({ value: id, label: name }));
  }, [contentTypes, contentTypeQuery, selectedContentTypes]);

  const getSelectedContentTypes = useCallback(() => {
    return siteConfigs[configIndex]?.selectedContentTypes.map((ctId) => {
      const contentType = contentTypes.find(([id, _]) => ctId === id);
      return { value: contentType[0], label: contentType[1] };
    });
  }, [configIndex, siteConfigs, contentTypes]);

  useEffect(() => {
    if (contentTypes) {
      setAvailableContentTypes(getAvailableContentTypes());
    }
  }, [contentTypes, getAvailableContentTypes]);

  useEffect(() => {
    if (!isNewSite) {
      const siteConfig = siteConfigs[configIndex];

      if (siteConfig?.name) {
        setDisplayName(siteConfig.name);
      }

      setSiteId(siteConfig.netlifySiteId);
    }
  }, [configIndex, isNewSite, siteConfigs]);

  useEffect(() => {
    const isContentTypesSelected = !isNewSite && siteConfigs[configIndex]?.selectedContentTypes?.length > 0;

    if (isContentTypesSelected) {
      const selected = getSelectedContentTypes();

      setIsDeploysOn(isContentTypesSelected);
      setSelectedContentTypes(selected);
    }
  }, [configIndex, isNewSite, siteConfigs, getSelectedContentTypes]);

  return (
    <Modal isShown={isShown} onClose={onCancel} size="medium">
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
                <div className={styles.contentTypeSelect}>
                  <Autocomplete
                    id={contentTypeSelectId}
                    name={contentTypeSelectId}
                    items={availableContentTypes}
                    emptyListMessage="There a no content types"
                    noMatchesMessage="Your search didn't match any content type"
                    placeholder="Add more content types..."
                    width="full"
                    onChange={onSelectContentType}
                    onQueryChange={onContentTypeQueryChange}
                  >
                    {(options) => options.map((option) => <span key={option.value}>{option.label}</span>)}
                  </Autocomplete>
                  {renderSelectedContentTypes()}
                </div>
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
