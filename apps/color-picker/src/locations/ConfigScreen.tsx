import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Button,
  Card,
  Flex,
  Paragraph,
  Subheading,
  TextLink,
  TextInput,
  IconButton,
} from '@contentful/f36-components';
import { ExternalLinkIcon, PlusIcon, DeleteIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { BaseSyntheticEvent, useCallback, useEffect, useState } from 'react';
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
  nameInput: css({
    width: '150px',
  }),
};

const ConfigScreen = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    themes: [],
  });
  const sdk = useSDK<ConfigAppSDK>();

  const addSwatch = (event: BaseSyntheticEvent, themeIndex: number) => {
    const newThemes = [...parameters.themes];
    newThemes[themeIndex].colors.push({
      id: window.crypto.randomUUID(),
      name: '',
      value: '#0088cc',
      theme: newThemes[themeIndex].name,
    });
    setParameters({ ...parameters, themes: newThemes });
  };

  const addTheme = () => {
    setParameters({
      ...parameters,
      themes: [
        ...parameters.themes,
        { id: window.crypto.randomUUID(), name: themeName, colors: [] },
      ],
    });
    setThemeName(themeName);
  };

  const removeTheme = (themeIndex: number) => {
    const newThemes = parameters.themes.filter((_, index) => index !== themeIndex);
    setParameters({ ...parameters, themes: newThemes });
  };

  const removeSwatch = (themeIndex: number, swatch: Color) => {
    const newThemes = [...parameters.themes];
    newThemes[themeIndex].colors = newThemes[themeIndex].colors.filter((i) => i.id !== swatch.id);
    setParameters({ ...parameters, themes: newThemes });
  };

  const updateSwatch = (themeIndex: number, swatch: Color) => {
    const newThemes = [...parameters.themes];
    newThemes[themeIndex].colors = newThemes[themeIndex].colors.map((color) =>
      color.id === swatch.id ? swatch : color
    );
    setParameters({ ...parameters, themes: newThemes });
  };

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

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

      if (currentParameters && currentParameters.themes && currentParameters.themes.length > 0) {
        setParameters(currentParameters);
      } else {
        setParameters({
          themes: [
            {
              id: window.crypto.randomUUID(),
              name: 'Default Theme',
              colors: [],
            },
          ],
        });
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
        {parameters.themes.map((theme, index) => (
          <Card key={theme.id}>
            <div>
              <Flex justifyContent="space-between" alignItems="center">
                <Subheading marginBottom="spacingXs">
                  <TextInput
                    name="ThemeName"
                    placeholder="Theme Name"
                    size="small"
                    value={theme.name}
                    onChange={(e) => {
                      const newThemes = [...parameters.themes];
                      newThemes[index].name = e.target.value;
                      setParameters({ ...parameters, themes: newThemes });
                    }}
                    isRequired
                    className={styles.nameInput}
                  />
                </Subheading>
                <IconButton
                  variant="transparent"
                  size="small"
                  aria-label="Remove theme"
                  onClick={() => removeTheme(index)}
                  icon={<DeleteIcon variant="muted" />}
                />
              </Flex>

              <Paragraph>
                Specify a set of predefined colors that editors can choose from.
              </Paragraph>
              {theme.colors.map((swatch) => (
                <SwatchEditor
                  key={swatch.id}
                  swatch={swatch}
                  onChange={(updatedSwatch) => updateSwatch(index, updatedSwatch)}
                  onRemove={() => removeSwatch(index, swatch)}
                />
              ))}

              <Button
                size="small"
                startIcon={<PlusIcon />}
                onClick={(e: BaseSyntheticEvent) => addSwatch(e, index)}>
                Add color
              </Button>
            </div>
          </Card>
        ))}
        {
          <Button size="small" startIcon={<PlusIcon />} onClick={addTheme}>
            {`${parameters.themes.length ? 'Add another theme' : 'Add a theme'}`}
          </Button>
        }
        {isInstalled && (
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
        )}
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
