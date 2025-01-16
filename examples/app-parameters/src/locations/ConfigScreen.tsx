import { ConfigAppSDK } from '@contentful/app-sdk';
import { FormControl, Heading, Paragraph, Radio } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import AddToSidebarSection from '../components/AddToSidebarSection';
import useSaveConfigHandler from '../hooks/useSaveConfigHandler';
import { ContentTypeProps } from 'contentful-management';
import useGetAllContentTypes from '../hooks/useGetAllContentTypes';

/*
  This interface defines the shape of the app installation parameters.
  It is used to type the state of the app configuration screen.
  For more details see https://www.contentful.com/developers/docs/extensibility/app-framework/sdk-reference/#app-configuration
*/
export interface AppInstallationParameters {
  displayFieldDetails: boolean;
  displayEditLink: boolean;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    displayFieldDetails: true,
    displayEditLink: true,
  });

  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  const { allContentTypes, selectedContentTypes, setSelectedContentTypes, isLoading } =
    useGetAllContentTypes();
  useSaveConfigHandler(parameters, selectedContentTypes);

  const handleCheckboxChange = (contentType: ContentTypeProps, isChecked: boolean) => {
    const selectedContentTypesCopy = { ...selectedContentTypes };
    if (isChecked) {
      delete selectedContentTypesCopy[contentType.sys.id];
    } else {
      selectedContentTypesCopy[contentType.sys.id] = allContentTypes.find(
        (ct) => ct.sys.id === contentType.sys.id
      )?.settings?.contentTypeColor;
    }
    setSelectedContentTypes(selectedContentTypesCopy);
  };

  const handleColorChange = (contentType: ContentTypeProps, color: string) => {
    const selectedContentTypesCopy = { ...selectedContentTypes };
    selectedContentTypesCopy[contentType.sys.id] = color;
    setSelectedContentTypes(selectedContentTypesCopy);
  };

  return (
    <div className={styles.body}>
      <Heading>Content Type Summary App</Heading>
      <Paragraph>
        This app displays a summary of the content type in the entry's sidebar and allows you
        color-code your content types. Additionally, the app has two actions: view app details and
        edit content type. These actions are enabled by default. This example app allows app
        developers to see examples of how to use the three different app parameters: installation,
        instance, and invocation.
      </Paragraph>
      <hr className={styles.splitter} />
      <Heading>Configuration</Heading>
      <FormControl testId="display-field-details" isRequired>
        <FormControl.Label>Display Field Details</FormControl.Label>
        <Radio.Group
          name="display-field-details"
          value={parameters.displayFieldDetails ? 'yes' : 'no'}
          onChange={(e) => {
            setParameters({
              ...parameters,
              displayFieldDetails: e.target.value === 'yes' ? true : false,
            });
          }}>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
        <FormControl.HelpText>
          Determines whether the Field Details Action is displayed on the sidebar
        </FormControl.HelpText>
      </FormControl>
      <FormControl testId="edit-link" isRequired>
        <FormControl.Label>Display Edit Content Type Link</FormControl.Label>
        <Radio.Group
          name="edit-link"
          value={parameters.displayEditLink ? 'yes' : 'no'}
          onChange={(e) => {
            setParameters({
              ...parameters,
              displayEditLink: e.target.value === 'yes' ? true : false,
            });
          }}>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
        <FormControl.HelpText>
          Determines whether the Edit Content Type Link is displayed on the sidebar
        </FormControl.HelpText>
      </FormControl>
      {!isLoading ? (
        <AddToSidebarSection
          allContentTypes={allContentTypes}
          selectedContentTypes={selectedContentTypes}
          handleCheckboxChange={handleCheckboxChange}
          handleColorChange={handleColorChange}
        />
      ) : null}
    </div>
  );
};

export default ConfigScreen;
