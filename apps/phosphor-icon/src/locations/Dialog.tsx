import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Paragraph,
  Pill,
  Select,
  Stack,
  Text,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { css } from 'emotion';
import * as PhosphorIcons from '@phosphor-icons/react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { IconGrid } from '../components/IconGrid/IconGrid';
import { IconSearch } from '../components/IconSearch/IconSearch';
import { WeightFilter } from '../components/WeightFilter/WeightFilter';
import { useIconCatalog } from '../hooks/useIconCatalog';
import { useIconSearch } from '../hooks/useIconSearch';
import type { IconCatalogEntry, IconFieldValue, IconWeight } from '../types/icon';
import { formatPositionLabel, ICON_WEIGHT_LABELS } from '../types/icon';
import type { DialogInvocationParameters, DialogSelectionMode } from '../types/parameters';

const DEFAULT_DIALOG_HEIGHT = 480;
const MIN_DIALOG_HEIGHT = 360;

const styles = {
  container: css({
    display: 'grid',
    gridTemplateRows: 'auto auto auto auto',
    minHeight: 0,
    padding: '24px',
    paddingBottom: '24px',
    boxSizing: 'border-box',
    gap: '20px',
    overflow: 'hidden',
  }),
  containerSingle: css({
    width: '100%',
    maxWidth: '760px',
    margin: '0 auto',
    gridTemplateRows: 'auto auto auto auto',
    paddingBottom: '0',
    gap: '12px',
  }),
  footer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: 'none',
  }),
  footerSingle: css({
    justifyContent: 'flex-end',
    paddingTop: '8px',
    borderTop: 'none',
  }),
  topSection: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '20px',
  }),
  topSectionSingle: css({
    gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 260px)',
    alignItems: 'start',
    '@media(max-width: 560px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  }),
  controls: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 180px',
    gap: '12px',
    alignItems: 'end',
  }),
  controlsSingle: css({
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 180px) minmax(0, 180px)',
    '@media(max-width: 520px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  }),
  controlsMulti: css({
    gridTemplateColumns: 'minmax(0, 1fr)',
  }),
  body: css({
    minHeight: 0,
    overflow: 'hidden',
    display: 'grid',
    gridTemplateRows: '56px minmax(0, 1fr)',
    gap: '12px',
  }),
  bodySingle: css({
    gridTemplateRows: 'minmax(0, 1fr)',
    minHeight: 0,
  }),
  chipTray: css({
    border: '1px solid #cfd9e5',
    borderRadius: '8px',
    backgroundColor: '#f7f9fa',
    padding: '8px 12px',
    minHeight: '56px',
    maxHeight: '56px',
    overflowY: 'auto',
    boxSizing: 'border-box',
  }),
  gridArea: css({
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
  }),
  gridAreaSingle: css({
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
  }),
  selectedCard: css({
    border: '1px solid #cfd9e5',
    borderRadius: '8px',
    backgroundColor: '#f7f9fa',
  }),
  selectedGlyph: css({
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #cfd9e5',
    flexShrink: 0,
  }),
  selectedMeta: css({
    minWidth: 0,
  }),
  selectedName: css({
    display: 'block',
    overflowWrap: 'anywhere',
  }),
  grow: css({
    flex: 1,
  }),
  minControl: css({
    minWidth: 0,
  }),
  sourceLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none',
  }),
};

function SelectedIconCard({
  icon,
  selectedCount,
  mode,
}: {
  icon: IconFieldValue | null;
  selectedCount: number;
  mode: DialogSelectionMode;
}) {
  const IconComponent = icon
    ? (PhosphorIcons as Record<string, React.ComponentType<{ size?: number; weight?: string }>>)[
        icon.componentName
      ]
    : null;

  return (
    <Box className={styles.selectedCard} padding="spacingM">
      <Text fontColor="gray600" fontSize="fontSizeS">
        {mode === 'multi' ? 'Current selection' : 'Selected icon'}
      </Text>
      <Flex gap="spacingS" marginTop="spacingS" alignItems="center">
        <Box className={styles.selectedGlyph}>
          {IconComponent ? <IconComponent size={22} weight={icon?.weight} /> : <Text>?</Text>}
        </Box>
        <Box className={styles.selectedMeta}>
          <Text fontWeight="fontWeightDemiBold" className={styles.selectedName}>
            {icon?.name ?? (mode === 'multi' ? 'No icons selected' : 'No icon selected')}
          </Text>
          {mode === 'multi' ? (
            <Text fontColor="gray600">{selectedCount} icon(s) selected</Text>
          ) : (
            <Text fontColor="gray600" fontSize="fontSizeS">
              {icon
                ? `${formatPositionLabel(icon.position)} / ${ICON_WEIGHT_LABELS[icon.weight]}`
                : 'Choose one icon'}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as DialogInvocationParameters;
  const mode = invocationParams?.mode ?? 'single';
  const enabledWeights = invocationParams?.enabledWeights ?? ['regular'];
  const positionOptions = invocationParams?.positionOptions ?? ['start', 'end'];
  const currentValue = invocationParams?.currentValue ?? null;
  const currentStyleAllowed = currentValue ? enabledWeights.includes(currentValue.weight) : true;

  const [weight, setWeight] = useState<IconWeight>(
    currentValue?.weight && currentStyleAllowed ? currentValue.weight : enabledWeights[0]
  );
  const [position, setPosition] = useState(currentValue?.position ?? positionOptions[0]);
  const [selectedIcon, setSelectedIcon] = useState<IconFieldValue | null>(currentValue);
  const [selectedIconNames, setSelectedIconNames] = useState<string[]>(
    invocationParams?.selectedIconNames ?? (currentValue ? [currentValue.name] : [])
  );
  const [previewIconName, setPreviewIconName] = useState<string | null>(currentValue?.name ?? null);
  const [dialogHeight, setDialogHeight] = useState(DEFAULT_DIALOG_HEIGHT);
  const [visibleRows, setVisibleRows] = useState(4);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const catalog = useIconCatalog();
  const scopedCatalog = useMemo(() => {
    const allowedNames = invocationParams?.allowedIconNames;

    if (!allowedNames || allowedNames.length === 0) {
      return catalog;
    }

    return catalog.filter((icon) => allowedNames.includes(icon.name));
  }, [catalog, invocationParams?.allowedIconNames]);
  const { query, setQuery, results } = useIconSearch({ catalog: scopedCatalog });

  useEffect(() => {
    const syncDialogLayout = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const viewportOffset = mode === 'multi' ? 320 : 220;
      const nextDialogHeight = Math.max(
        MIN_DIALOG_HEIGHT,
        Math.min(DEFAULT_DIALOG_HEIGHT, viewportHeight - viewportOffset)
      );
      const nextVisibleRows =
        mode === 'multi' ? (nextDialogHeight >= 420 ? 2 : 1) : nextDialogHeight >= 520 ? 4 : 3;

      setDialogHeight(nextDialogHeight);
      setVisibleRows(nextVisibleRows);
    };

    sdk.window.stopAutoResizer();
    syncDialogLayout();
    window.addEventListener('resize', syncDialogLayout);

    return () => {
      window.removeEventListener('resize', syncDialogLayout);
    };
  }, [mode, sdk.window]);

  useLayoutEffect(() => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const viewportOffset = mode === 'multi' ? 320 : 220;
    const availableHeight = Math.max(MIN_DIALOG_HEIGHT, viewportHeight - viewportOffset);
    const measuredHeight =
      (topSectionRef.current?.offsetHeight ?? 0) +
      (controlsRef.current?.offsetHeight ?? 0) +
      (bodyRef.current?.offsetHeight ?? 0) +
      (footerRef.current?.offsetHeight ?? 0) +
      24 + // top padding
      24 + // bottom padding
      20 + // top to controls gap
      20 + // controls to body gap
      20; // body to footer gap

    const nextHeight = Math.min(Math.max(MIN_DIALOG_HEIGHT, measuredHeight), availableHeight);

    if (Math.abs(nextHeight - dialogHeight) > 1) {
      setDialogHeight(nextHeight);
    }

    sdk.window.updateHeight(nextHeight);
  }, [dialogHeight, sdk.window, visibleRows, results.length, mode, selectedIconNames.length]);

  const previewCatalogEntry = useMemo(() => {
    const previewName =
      previewIconName ??
      selectedIcon?.name ??
      selectedIconNames[selectedIconNames.length - 1] ??
      null;
    return previewName ? catalog.find((icon) => icon.name === previewName) ?? null : null;
  }, [catalog, previewIconName, selectedIcon, selectedIconNames]);

  const previewValue = useMemo<IconFieldValue | null>(() => {
    if (mode === 'single') {
      return selectedIcon;
    }

    if (!previewCatalogEntry) {
      return null;
    }

    return {
      name: previewCatalogEntry.name,
      componentName: previewCatalogEntry.componentName,
      weight,
      position,
    };
  }, [mode, position, previewCatalogEntry, selectedIcon, weight]);

  const handleSelect = useCallback(
    (icon: IconCatalogEntry) => {
      if (mode === 'multi') {
        setSelectedIconNames((currentNames) => {
          const isSelected = currentNames.includes(icon.name);
          return isSelected
            ? currentNames.filter((name) => name !== icon.name)
            : [...currentNames, icon.name];
        });
        setPreviewIconName(icon.name);
        return;
      }

      setSelectedIcon({
        name: icon.name,
        componentName: icon.componentName,
        weight,
        position,
      });
      setPreviewIconName(icon.name);
    },
    [mode, position, weight]
  );

  const handleWeightChange = useCallback((newWeight: IconWeight) => {
    setWeight(newWeight);
    setSelectedIcon((currentIcon) =>
      currentIcon
        ? {
            ...currentIcon,
            weight: newWeight,
          }
        : currentIcon
    );
  }, []);

  const handlePositionChange = useCallback((newPosition: string) => {
    setPosition(newPosition);
    setSelectedIcon((currentIcon) =>
      currentIcon
        ? {
            ...currentIcon,
            position: newPosition,
          }
        : currentIcon
    );
  }, []);

  const handleConfirm = useCallback(() => {
    if (mode === 'multi') {
      sdk.close(selectedIconNames);
      return;
    }

    sdk.close(selectedIcon);
  }, [mode, sdk, selectedIcon, selectedIconNames]);

  const handleCancel = useCallback(() => {
    sdk.close(null);
  }, [sdk]);

  useEffect(() => {
    if (!enabledWeights.includes(weight)) {
      setWeight(enabledWeights[0]);
    }
  }, [enabledWeights, weight]);

  return (
    <div className={`${styles.container} ${mode === 'single' ? styles.containerSingle : ''}`}>
      <div
        ref={topSectionRef}
        className={`${styles.topSection} ${mode === 'single' ? styles.topSectionSingle : ''}`}>
        <Box>
          <Heading marginBottom="spacingS">
            {mode === 'multi' ? 'Choose allowed icons' : 'Select a Phosphor Icon'}
          </Heading>
          <Paragraph marginBottom="spacingS">
            {mode === 'multi'
              ? 'Search the full Phosphor library and choose the icons editors are allowed to use.'
              : 'Search the Phosphor icon library and keep the selected icon visible while you tune its style and position.'}
          </Paragraph>
          <Text fontColor="gray600">
            Source:{' '}
            <a
              className={styles.sourceLink}
              href="https://phosphoricons.com/"
              target="_blank"
              rel="noopener noreferrer">
              <span>Phosphor Icons</span>
              <ExternalLinkIcon size="tiny" />
            </a>
          </Text>
        </Box>
        {mode === 'single' && (
          <SelectedIconCard
            icon={previewValue}
            selectedCount={selectedIconNames.length}
            mode={mode}
          />
        )}
      </div>

      <div
        ref={controlsRef}
        className={`${styles.controls} ${
          mode === 'single' ? styles.controlsSingle : styles.controlsMulti
        }`}>
        <Box className={styles.grow}>
          <FormControl marginBottom="none">
            <FormControl.Label>Search icons</FormControl.Label>
            <IconSearch value={query} onChange={setQuery} placeholder="Search icons or tags" />
          </FormControl>
        </Box>
        {mode === 'single' && (
          <Box className={styles.minControl}>
            <FormControl marginBottom="none">
              <FormControl.Label>Style</FormControl.Label>
              <WeightFilter
                value={weight}
                onChange={handleWeightChange}
                enabledWeights={enabledWeights}
                forceSelect={!currentStyleAllowed}
              />
            </FormControl>
          </Box>
        )}
        {mode === 'single' && (
          <Box className={styles.minControl}>
            <FormControl marginBottom="none">
              <FormControl.Label>Position</FormControl.Label>
              <Select
                value={position}
                onChange={(event) => handlePositionChange(event.target.value)}
                aria-label="Position">
                {positionOptions.map((option) => (
                  <Select.Option key={option} value={option}>
                    {formatPositionLabel(option)}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </div>

      <div ref={bodyRef} className={`${styles.body} ${mode === 'single' ? styles.bodySingle : ''}`}>
        {mode === 'multi' ? (
          <div className={styles.chipTray}>
            {selectedIconNames.length > 0 ? (
              <Flex gap="spacingXs" flexWrap="wrap">
                {selectedIconNames.map((iconName) => (
                  <Pill
                    key={iconName}
                    label={iconName}
                    onClose={() =>
                      setSelectedIconNames((currentNames) =>
                        currentNames.filter((name) => name !== iconName)
                      )
                    }
                  />
                ))}
              </Flex>
            ) : (
              <Text fontColor="gray600">No icons selected yet.</Text>
            )}
          </div>
        ) : null}

        <div className={`${styles.gridArea} ${mode === 'single' ? styles.gridAreaSingle : ''}`}>
          <IconGrid
            icons={results}
            weight={weight}
            selectedIconNames={
              mode === 'multi' ? selectedIconNames : selectedIcon ? [selectedIcon.name] : []
            }
            onSelect={handleSelect}
            maxVisibleRows={visibleRows}
          />
        </div>
      </div>

      <div
        ref={footerRef}
        className={`${styles.footer} ${mode === 'single' ? styles.footerSingle : ''}`}>
        <Text fontColor="gray600">
          {mode === 'multi' ? `${selectedIconNames.length} icon(s) selected` : ''}
        </Text>
        <Flex gap="spacingS">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isDisabled={mode === 'multi' ? selectedIconNames.length === 0 : !selectedIcon}>
            {mode === 'multi' ? 'Save selected icons' : 'Select icon'}
          </Button>
        </Flex>
      </div>
    </div>
  );
};

export default Dialog;
