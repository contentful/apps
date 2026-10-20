import { useState, useEffect, useCallback } from 'react';
import { Flex, Button, Heading, Text, Box, Select, FormControl } from '@contentful/f36-components';
import { css } from 'emotion';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useIconCatalog } from '../hooks/useIconCatalog';
import { useIconSearch } from '../hooks/useIconSearch';
import { IconGrid } from '../components/IconGrid/IconGrid';
import { IconSearch } from '../components/IconSearch/IconSearch';
import { WeightFilter } from '../components/WeightFilter/WeightFilter';
import type { IconCatalogEntry, IconWeight, IconPosition, IconFieldValue } from '../types/icon';
import { ICON_POSITIONS, ICON_POSITION_LABELS } from '../types/icon';
import type { DialogInvocationParameters } from '../types/parameters';
import { parseEnabledWeights } from '../types/parameters';

const styles = {
  container: css({
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
    height: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
    gap: '12px',
  }),
  header: css({
    marginBottom: '16px',
  }),
  controls: css({
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    alignItems: 'flex-end',
  }),
  searchWrapper: css({
    flex: 1,
  }),
  weightWrapper: css({
    minWidth: '140px',
  }),
  positionWrapper: css({
    minWidth: '140px',
  }),
  gridWrapper: css({
    minHeight: 0,
    overflowY: 'auto',
    paddingRight: '4px',
  }),
  footer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    position: 'sticky',
    bottom: 0,
  }),
  selectedInfo: css({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),
  actions: css({
    display: 'flex',
    gap: '12px',
  }),
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as DialogInvocationParameters;

  const enabledWeights = parseEnabledWeights(invocationParams?.enabledWeights || ['regular']);
  const currentValue = invocationParams?.currentValue;

  const [selectedIcon, setSelectedIcon] = useState<IconFieldValue | null>(currentValue || null);
  const [weight, setWeight] = useState<IconWeight>(currentValue?.weight || enabledWeights[0]);
  const [position, setPosition] = useState<IconPosition>(currentValue?.position || 'before');

  const catalog = useIconCatalog();
  const { query, setQuery, results } = useIconSearch({ catalog });

  useEffect(() => {
    // Use a fixed dialog height to avoid auto-resize jitter while the grid renders
    sdk.window.stopAutoResizer();
    sdk.window.updateHeight(760);
  }, [sdk.window]);

  const handleSelect = useCallback(
    (icon: IconCatalogEntry) => {
      setSelectedIcon({
        name: icon.name,
        componentName: icon.componentName,
        weight,
        position,
      });
    },
    [weight, position]
  );

  const handleWeightChange = useCallback(
    (newWeight: IconWeight) => {
      setWeight(newWeight);
      // Update selected icon's weight if one is selected
      if (selectedIcon) {
        setSelectedIcon({
          ...selectedIcon,
          weight: newWeight,
        });
      }
    },
    [selectedIcon]
  );

  const handlePositionChange = useCallback(
    (newPosition: IconPosition) => {
      setPosition(newPosition);
      // Update selected icon's position if one is selected
      if (selectedIcon) {
        setSelectedIcon({
          ...selectedIcon,
          position: newPosition,
        });
      }
    },
    [selectedIcon]
  );

  const handleConfirm = useCallback(() => {
    sdk.close(selectedIcon);
  }, [sdk, selectedIcon]);

  const handleCancel = useCallback(() => {
    sdk.close(null);
  }, [sdk]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Heading marginBottom="none">Select an Icon</Heading>
        <Text fontColor="gray600">
          <a
            href="https://phosphoricons.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#2563eb' }}>
            phosphoricons.com
          </a>
        </Text>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <IconSearch value={query} onChange={setQuery} />
        </div>
        <div className={styles.weightWrapper}>
          <FormControl marginBottom="none">
            <FormControl.Label>Weight</FormControl.Label>
            <WeightFilter
              value={weight}
              onChange={handleWeightChange}
              enabledWeights={enabledWeights}
            />
          </FormControl>
        </div>
        <div className={styles.positionWrapper}>
          <FormControl marginBottom="none">
            <FormControl.Label>Position</FormControl.Label>
            <Select
              value={position}
              onChange={(e) => handlePositionChange(e.target.value as IconPosition)}>
              <Select.Option value="">Select position</Select.Option>
              {ICON_POSITIONS.map((pos) => (
                <Select.Option key={pos} value={pos}>
                  {ICON_POSITION_LABELS[pos]}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className={styles.gridWrapper}>
        <IconGrid
          icons={results}
          weight={weight}
          selectedIcon={selectedIcon}
          onSelect={handleSelect}
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.selectedInfo}>
          {selectedIcon ? (
            <Text fontColor="gray700">
              Selected: <strong>{selectedIcon.name}</strong>
            </Text>
          ) : (
            <Text fontColor="gray500">No icon selected</Text>
          )}
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} isDisabled={!selectedIcon}>
            Select
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
