import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  FormControl,
  Select,
  TextInput,
  Button,
  Option,
  Checkbox,
  Pill,
  Autocomplete,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

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
  allContentTypes: css({
    fontWeight: 500,
  }),
};

const PICK_OPTION_VALUE = '__pick__';
const ALL_CONTENT_TYPES_VALUE = '__all__';

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

  const serializeSelectedContentTypes = () => {
    if (!isDeploysOn) return [];

    if (selectedContentTypes.length === contentTypes.length) {
      return '*';
    }

    if (selectedContentTypes.length === 0) {
      return [];
    }

    return selectedContentTypes.map((contentType) => contentType.value);
  };

  const updateSiteData = (selectedSite) => {
    return {
      name: displayName,
      netlifySiteId: selectedSite.id,
      netlifySiteName: selectedSite.name,
      netlifySiteUrl: selectedSite.ssl_url || selectedSite.url,
      selectedContentTypes: serializeSelectedContentTypes(),
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
    setContentTypeQuery('');
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
    const selected = availableContentTypes.filter((contentType) => {
      if (item.value === ALL_CONTENT_TYPES_VALUE) {
        return contentType.value !== ALL_CONTENT_TYPES_VALUE;
      } else {
        return contentType.value === item.value;
      }
    });

    if (selected.length > 0) {
      setSelectedContentTypes([...selectedContentTypes, ...selected ]);
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
    const items = contentTypes
      .filter(([id, _]) => !selectedContentTypes.some((contentType) => contentType.value === id))
      .filter(([_, name]) => contentTypeQuery ? new RegExp(contentTypeQuery, 'i').test(name) : true)
      .map(([id, name]) => ({ value: id, label: name }));
    return [{ value: ALL_CONTENT_TYPES_VALUE, label: 'All Content Types' }, ...items];
  }, [contentTypes, contentTypeQuery, selectedContentTypes]);

  const getContentTypesFromConfig = useCallback(() => {
    const types = siteConfigs[configIndex]?.selectedContentTypes;

    if (types === '*') {
      return contentTypes.map(([id, name]) => ({ value: id, label: name }));
    }

    return types.map((ctId) => {
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
    if (isNewSite) return;

    const siteConfig = siteConfigs[configIndex];

    if (siteConfig?.name) {
      setDisplayName(siteConfig.name);
    }

    setSiteId(siteConfig.netlifySiteId);
  }, [configIndex, isNewSite, siteConfigs]);

  useEffect(() => {
    if (isNewSite) return;

    const selected = getContentTypesFromConfig();
    const isContentTypesSelected = selected.length > 0;

    if (isContentTypesSelected) {
      setIsDeploysOn(isContentTypesSelected);
      setSelectedContentTypes(selected);
    }
  }, [isNewSite, getContentTypesFromConfig]);

  return (
    <Modal isShown={isShown} onClose={onCancel} size="medium">
      {() => (
        <>
          <Modal.Header title={isNewSite ? 'Add site' : 'Edit site'} />
          <Modal.Content>
            <Form onSubmit={onConfirm} spacing="default">
              <FormControl marginBottom="spacingM">
                <FormControl.Label>Netlify site</FormControl.Label>
                <Select
                  id={selectId}
                  name={selectId}
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
                </Select>
              </FormControl>
              <FormControl marginBottom="spacingM">
                <FormControl.Label>Display name</FormControl.Label>
                <TextInput
                  id={inputId}
                  name={inputId}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </FormControl>
              <FormControl marginBottom="spacingS">
                <Checkbox
                  name={deploysId}
                  isChecked={isDeploysOn}
                  helpText="Rebuild site when an entry of matching content types or assets are published or unpublished"
                  onChange={(e) => setIsDeploysOn(e.target.checked)}
                >
                  Automatic deploys on publish events
                </Checkbox>
              </FormControl>
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
                    itemToString={(item) => item.label}
                    renderItem={(item) => (
                      <span
                        key={item.value}
                        className={item.value === ALL_CONTENT_TYPES_VALUE ? styles.allContentTypes : ''}
                      >
                        {item.label}
                      </span>
                    )}
                    clearAfterSelect
                    onSelectItem={onSelectContentType}
                    onInputValueChange={onContentTypeQueryChange}
                  />
                  {renderSelectedContentTypes()}
                </div>
              )}
            </Form>
          </Modal.Content>
          <Modal.Controls className={styles.controls}>
            <Button variant="secondary" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="positive" size="small" onClick={onConfirm} disabled={!siteId || !displayName.trim()}>
              Confirm
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
