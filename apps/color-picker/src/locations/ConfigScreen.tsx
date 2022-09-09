/** @jsxImportSource @emotion/react */

import { AppExtensionSDK } from '@contentful/app-sdk';
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
import { css, Global } from '@emotion/react';
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SwatchEditor from '../components/SwatchEditor';

export interface AppInstallationParameters {
  themes: Theme[];
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
  const sdk = useSDK<AppExtensionSDK>();

  const addSwatch = () => {
    setParameters({
      ...parameters,
      themes: [
        {
          ...parameters.themes[0],
          colors: [
            ...parameters.themes[0].colors,
            { id: uuidv4(), name: '', value: '#0088cc' },
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
    const index = parameters.themes[0].colors.findIndex(
      (i) => i.id === swatch.id
    );
    let newTheme = parameters.themes[0];
    newTheme.colors[index] = swatch;

    setParameters({
      ...parameters,
      themes: [newTheme],
    });
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
      const currentParameters =
        await sdk.app.getParameters<AppInstallationParameters>();

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
      style={{ backgroundColor: tokens.gray100, minHeight: '100%' }}
    >
      <Global
        styles={css`
          body,
          html,
          #root {
            height: 100%;
          }
        `}
      />

      <Flex
        flexDirection="column"
        gap="spacingM"
        paddingBottom="spacingL"
        style={{ width: 600 }}
      >
        <Card>
          <div>
            <Subheading marginBottom="spacingXs">Theme</Subheading>
            <Paragraph>
              Optionally, specify a set of predefined colors that editors can
              choose from.
            </Paragraph>

            {parameters.themes[0].colors.map((swatch) => (
              <SwatchEditor
                key={swatch.id}
                swatch={swatch}
                onChange={updateSwatch}
                onRemove={removeSwatch}
              />
            ))}

            <Button
              size="small"
              startIcon={<PlusIcon />}
              onClick={addSwatch}
              isDisabled={parameters.themes[0].colors.length >= 25}
            >
              Add color
            </Button>
          </div>
        </Card>
        {isInstalled ? (
          <Card
            css={css`
              overflow: hidden;
            `}
          >
            <Flex flexDirection="row" alignItems="center">
              <Flex
                gap="spacingXs"
                flexDirection="column"
                alignItems="flex-start"
              >
                <Subheading marginBottom="none">
                  Up next: Assign the app to your fields
                </Subheading>
                <Paragraph marginBottom="none">
                  Set the Color Picker app as the appearance of JSON fields that
                  you want to use as a color picker.
                </Paragraph>
                <TextLink
                  target="_blank"
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href={`https://app.contentful.com/spaces/${
                    sdk.ids.space
                  }/environments/${
                    sdk.ids.environmentAlias || sdk.ids.environment
                  }/content_types`}
                >
                  Edit content model
                </TextLink>
              </Flex>
              <Flex
                flexShrink={0}
                css={css`
                  margin-right: -64px;
                  padding-left: 16px;
                `}
              >
                <img
                  src="./appearance-settings.png"
                  alt="Appearance settings"
                  css={css`
                    height: 195px;
                  `}
                />
              </Flex>
            </Flex>
          </Card>
        ) : (
          <Note variant="neutral">
            If you don't need a custom theme, go ahead and hit install in the
            top right!
          </Note>
        )}
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
