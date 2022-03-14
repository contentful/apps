import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  assetsDeployCheckbox: css({
    marginBottom: tokens.spacingXs,
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
  const [isAssetDeploysOn, setIsAssetDeploysOn] = useState(false);
  const [availableContentTypes, setAvailableContentTypes] = useState([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);
  const [contentTypeQuery, setContentTypeQuery] = useState('');
  const [isSelectedContentTypesInvalid, setIsSelectedContentTypesInvalid] = useState(false);

  const isNewSite = configIndex === undefined || configIndex === null;

  const selectId = `site-select-${configIndex ?? 'new'}`;
  const inputId = `site-input-${configIndex ?? 'new'}`;
  const deploysId = `deploys-checkbox-${configIndex ?? 'new'}`;
  const assetDeploysId = `asset-deploys-checkbox-${configIndex ?? 'new'}`;
  const contentTypeSelectId = `content-type-select-${configIndex ?? 'new'}`;

  const availableNetlifySites = useMemo(() => {
    const configuredSiteIds = siteConfigs.map((config) => config.netlifySiteId);
    if (isNewSite) {
      return netlifySites.filter((site) => !configuredSiteIds.includes(site.id));
    }

    return netlifySites.filter((site) => !configuredSiteIds.includes(site.id) || siteConfigs[configIndex].netlifySiteId === site.id);
  }, [isNewSite, configIndex, netlifySites, siteConfigs]);

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
      assetDeploysOn: isAssetDeploysOn || false,
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
    setIsDeploysOn(false);
    setIsAssetDeploysOn(false);
    setSelectedContentTypes([]);
    setContentTypeQuery('');
    setIsSelectedContentTypesInvalid(false);
  };

  const onConfirm = () => {
    if (isDeploysOn && selectedContentTypes.length === 0) {
      setIsSelectedContentTypesInvalid(true);
      return;
    }

    setIsSelectedContentTypesInvalid(false);
    updateConfig();
    onClose();
  };

  const onCancel = () => {
    onClose();
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
      setIsSelectedContentTypesInvalid(false);
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
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => {
        const aLabel = a.label.toUpperCase();
        const bLabel = b.label.toUpperCase();

        if (aLabel > bLabel ) return 1;
        if (aLabel < bLabel ) return -1;

        return 0;
      });

    return [{ value: ALL_CONTENT_TYPES_VALUE, label: 'Select all Content Types' }, ...items];
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
    setIsAssetDeploysOn(siteConfigs[configIndex]?.assetDeploysOn || false);
  }, [configIndex, isNewSite, siteConfigs]);

  useEffect(() => {
    if (isNewSite) return;

    const selected = getContentTypesFromConfig();

    setIsDeploysOn(selected.length > 0);
    setSelectedContentTypes(selected);
  }, [isNewSite, getContentTypesFromConfig]);

  useEffect(() => {
    if (isShown && isNewSite) {
      resetFields();
    }
  }, [isShown, isNewSite]);

  useEffect(() => {
    if (!isDeploysOn) {
      setSelectedContentTypes([]);
      setIsSelectedContentTypesInvalid(false);
    }
  }, [isDeploysOn]);

  return (
    <Modal isShown={isShown} onClose={onCancel} size="medium" modalContentProps={{ paddingBottom: 'spacingM' }}>
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
                    <Option value={PICK_OPTION_VALUE}>Select a Netlify site</Option>
                  )}
                  {availableNetlifySites.length > 0 && availableNetlifySites.map((netlifySite) => {
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
                <FormControl.Label marginBottom={0}>Automatic deploys</FormControl.Label>
                <FormControl.HelpText marginTop={0} marginBottom="spacingS">Rebuild site automatically when content or assets are published or unpublished</FormControl.HelpText>
                <Checkbox
                  id={assetDeploysId}
                  name={assetDeploysId}
                  isChecked={isAssetDeploysOn}
                  className={styles.assetsDeployCheckbox}
                  onChange={(e) => setIsAssetDeploysOn(e.target.checked)}
                >
                  When assets are published or unpublished
                </Checkbox>
                <Checkbox
                  id={deploysId}
                  name={deploysId}
                  isChecked={isDeploysOn}
                  onChange={(e) => setIsDeploysOn(e.target.checked)}
                >
                  When content is published or unpublished
                </Checkbox>
              </FormControl>
              {isDeploysOn && (
                <div className={styles.contentTypeSelect}>
                  <FormControl marginBottom={0} isInvalid={isSelectedContentTypesInvalid}>
                    <Autocomplete
                      id={contentTypeSelectId}
                      name={contentTypeSelectId}
                      items={availableContentTypes}
                      emptyListMessage="There are no content types"
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
                      isDisabled={availableContentTypes.length === 1}
                      clearAfterSelect
                      onSelectItem={onSelectContentType}
                      onInputValueChange={onContentTypeQueryChange}
                    />
                    {isSelectedContentTypesInvalid && (
                      <FormControl.ValidationMessage>Add at least one Content type</FormControl.ValidationMessage>
                    )}
                  </FormControl>
                  {renderSelectedContentTypes()}
                </div>
              )}
            </Form>
          </Modal.Content>
          <Modal.Controls className={styles.controls}>
            <Button variant="secondary" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="positive"
              size="small"
              onClick={onConfirm}
              isDisabled={!siteId || siteId === PICK_OPTION_VALUE || !displayName.trim()}
            >
              Confirm
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
