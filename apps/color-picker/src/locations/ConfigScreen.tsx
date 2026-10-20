import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Button,
  Card,
  Flex,
  Note,
  Paragraph,
  Subheading,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon, PlusIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SwatchEditor from '../components/SwatchEditor';
import { AppInstallationParameters, Color } from '../types';

const styles = {
  body: css({
    backgroundColor: tokens.gray100,
    minHeight: '100vh',
  }),
  overflowHidden: css({
    overflow: 'hidden',
  }),
  appearanceSettingsImage: css({
    marginRight: '-64px',
    paddingLeft: '16px',
    height: '195px',
  }),
  cardColumn: css({
    width: '600px',
  }),
};

const DUPLICATE_COLOR_MESSAGE = 'Each color value must be unique.';

function normalizeHexValue(value: string) {
  return value.trim().toLowerCase();
}

function getDuplicateColorIds(colors: Color[]) {
  const idsByValue = new Map<string, string[]>();

  colors.forEach((color) => {
    const normalizedValue = normalizeHexValue(color.value);
    const ids = idsByValue.get(normalizedValue) ?? [];
    ids.push(color.id);
    idsByValue.set(normalizedValue, ids);
  });

  return new Set(
    Array.from(idsByValue.values())
      .filter((ids) => ids.length > 1)
      .flat()
  );
}

const ConfigScreen = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    themes: [
      {
        id: 'default',
        name: 'Default',
        colors: [],
      },
    ],
  });
  const sdk = useSDK<ConfigAppSDK>();
  const colors = parameters.themes[0].colors;

  const duplicateColorIds = useMemo(() => getDuplicateColorIds(colors), [colors]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleColorsDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setParameters((prev) => {
      const colors = prev.themes[0].colors;
      const oldIndex = colors.findIndex((c) => c.id === active.id);
      const newIndex = colors.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      return {
        ...prev,
        themes: [
          {
            ...prev.themes[0],
            colors: arrayMove(colors, oldIndex, newIndex),
          },
        ],
      };
    });
  }, []);

  const addSwatch = () => {
    setParameters({
      ...parameters,
      themes: [
        {
          ...parameters.themes[0],
          colors: [
            ...parameters.themes[0].colors,
            { id: window.crypto.randomUUID(), name: '', value: '#0088cc' },
          ],
        },
      ],
    });
  };

  const removeSwatch = (swatch: Color) => {
    setParameters({
      ...parameters,
      themes: [
        {
          ...parameters.themes[0],
          colors: parameters.themes[0].colors.filter((i) => i.id !== swatch.id),
        },
      ],
    });
  };

  const updateSwatch = (swatch: Color) => {
    const theme = parameters.themes[0];
    const newTheme = {
      ...theme,
      colors: theme.colors.map((color) => (color.id === swatch.id ? swatch : color)),
    };

    setParameters({
      ...parameters,
      themes: [newTheme],
    });
  };

  const onConfigure = useCallback(async () => {
    if (duplicateColorIds.size > 0) {
      sdk.notifier.error('Duplicate color values are not allowed');
      return false;
    }

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [duplicateColorIds, parameters, sdk]);

  useEffect(() => {
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted((err) => {
      if (!err) {
        setIsInstalled(true);
      }
    });
  }, [sdk]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    async function getInstallationStatus() {
      const isInstalled = await sdk.app.isInstalled();
      setIsInstalled(isInstalled);
    }

    getInstallationStatus();
  }, [sdk]);

  return (
    <Flex
      alignItems="center"
      flexDirection="column"
      paddingTop="spacing2Xl"
      paddingBottom="spacing2Xl"
      className={styles.body}>
      <Flex
        flexDirection="column"
        gap="spacingM"
        paddingBottom="spacingL"
        className={styles.cardColumn}>
        <Card>
          <div>
            <Subheading marginBottom="spacingXs">Theme</Subheading>
            <Paragraph>
              Optionally, specify a set of predefined colors that editors can choose from. Drag the
              handle beside each row to change the order shown in the entry editor.
            </Paragraph>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColorsDragEnd}>
              <SortableContext
                items={parameters.themes[0].colors.map((c) => c.id)}
                strategy={verticalListSortingStrategy}>
                {colors.map((swatch) => (
                  <SwatchEditor
                    key={swatch.id}
                    swatch={swatch}
                    onChange={updateSwatch}
                    onRemove={removeSwatch}
                    validationMessage={
                      duplicateColorIds.has(swatch.id) ? DUPLICATE_COLOR_MESSAGE : undefined
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button size="small" startIcon={<PlusIcon />} onClick={addSwatch}>
              Add color
            </Button>
          </div>
        </Card>
        {isInstalled ? (
          <Card className={styles.overflowHidden}>
            <Flex flexDirection="row" alignItems="center">
              <Flex gap="spacingXs" flexDirection="column" alignItems="flex-start">
                <Subheading marginBottom="none">Up next: Assign the app to your fields</Subheading>
                <Paragraph marginBottom="none">
                  Set the Color Picker app as the appearance of JSON fields that you want to use as
                  a color picker.
                </Paragraph>
                <TextLink
                  target="_blank"
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href={`https://${sdk.hostnames.webapp}/spaces/${sdk.ids.space}/environments/${
                    sdk.ids.environmentAlias || sdk.ids.environment
                  }/content_types`}>
                  Edit content model
                </TextLink>
              </Flex>

              <img
                src="./appearance-settings.png"
                alt="Appearance settings"
                className={styles.appearanceSettingsImage}
              />
            </Flex>
          </Card>
        ) : (
          <Note variant="neutral">
            If you don't need a custom theme, go ahead and hit install in the top right!
          </Note>
        )}
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
