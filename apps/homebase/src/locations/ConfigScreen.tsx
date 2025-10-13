import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Flex,
  Form,
  Heading,
  List,
  ListItem,
  Paragraph,
  Subheading,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { CreateContentTypeProps } from 'contentful-management';
import { useCallback, useEffect, useState } from 'react';
import { CONTENT_TYPE_ID, MARKDOWN_ID, TITLE_ID } from '../consts';

export interface AppInstallationParameters {}

const createContentType = async (sdk: ConfigAppSDK) => {
  const contentTypeBody: CreateContentTypeProps = {
    name: CONTENT_TYPE_ID,
    description: 'Content type used by the Homebase app to render the Contentful home page.',
    fields: [
      {
        id: TITLE_ID,
        name: 'Title',
        type: 'Symbol',
        required: true,
        localized: false,
      },
      {
        id: MARKDOWN_ID,
        name: 'Markdown',
        type: 'Text',
        required: false,
        localized: false,
      },
    ],
    displayField: TITLE_ID,
  };
  try {
    const contentTypeProps = await sdk.cma.contentType.createWithId(
      { contentTypeId: CONTENT_TYPE_ID },
      contentTypeBody
    );
    await sdk.cma.contentType.publish({ contentTypeId: CONTENT_TYPE_ID }, contentTypeProps);
  } catch (e: any) {
    sdk.notifier.error('Failed to create HOMEBASE content type. Please try again.');
    throw e;
  }
};

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    try {
      await sdk.cma.contentType.get({ contentTypeId: CONTENT_TYPE_ID });
    } catch (e) {
      await createContentType(sdk);
    }

    try {
      const currentUIConfig = await sdk.cma.uiConfig.get({});
      await sdk.cma.uiConfig.update(
        {},
        {
          ...currentUIConfig,
          homeViews: [
            {
              widgetNamespace: 'app',
              widgetId: sdk.ids.app,
            },
          ],
        }
      );
    } catch (e) {
      sdk.notifier.error('Failed to configure Home location. Please try again.');
      throw e;
    }

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" alignItems="center">
      <Form>
        <Heading>Set up Homebase</Heading>
        <Paragraph>The Homebase app enables you to customize your Contentful home page.</Paragraph>

        <Subheading marginTop="spacingXl">How it works</Subheading>
        <List as="ol">
          <ListItem>The app creates a unique content type called HOMEBASE.</ListItem>
          <ListItem>
            With the HOMEBASE content type, create entries that power the content on the home page.
          </ListItem>
          <ListItem>
            In the entry, use markdown within the rich text editor to edit the content and layout.
          </ListItem>
          <ListItem>
            Anyone with permissions to edit this content type can customize the homepage within the
            shared space.
          </ListItem>
        </List>

        <Subheading marginTop="spacingXl">Disclaimer</Subheading>
        <Paragraph>
          The Homebase app will create a content type labeled "HOMEBASE". If deleted, the app will
          not work.
        </Paragraph>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
