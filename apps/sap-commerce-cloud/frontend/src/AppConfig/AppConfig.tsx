import { ChangeEvent, useState, useEffect, useCallback } from 'react';

import { CollectionResponse, ConfigAppSDK } from '@contentful/app-sdk';
import {
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  TextInput,
  TextLink,
} from '@contentful/f36-components';

import FieldSelector from './FieldSelector';

import { toAppParameters, toInputParameters } from './parameters';

import {
  CompatibleFields,
  ContentType,
  EditorInterface,
  editorInterfacesToSelectedFields,
  getCompatibleFields,
  SelectedFields,
  selectedFieldsToTargetState,
} from './fields';

import { AppParameters, Config, ParameterDefinition, ValidateParametersFn } from '../interfaces';

import { styles } from './AppConfig.styles';
import { createClient } from 'contentful-management';

interface Props {
  sdk: ConfigAppSDK<AppParameters>;
  parameterDefinitions: ParameterDefinition[];
  validateParameters: ValidateParametersFn;
  logo: string;
  name: string;
  color: string;
  description: string;
}

export default function AppConfig({
  sdk,
  parameterDefinitions,
  validateParameters,
  logo,
  name,
  color,
  description,
}: Props) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [compatibleFields, setCompatibleFields] = useState<CompatibleFields>({});
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});
  const [parameters, setParameters] = useState<Config>(
    toInputParameters(parameterDefinitions, null)
  );

  const onAppConfigure = useCallback(() => {
    const error = validateParameters(parameters);

    if (error) {
      sdk.notifier.error(error);
      return false;
    }

    return {
      parameters: toAppParameters(parameterDefinitions, parameters),
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  }, [
    contentTypes,
    parameterDefinitions,
    parameters,
    sdk.notifier,
    selectedFields,
    validateParameters,
  ]);

  useEffect(() => {
    sdk.app.onConfigure(onAppConfigure);
  }, [sdk, onAppConfigure]);

  useEffect(() => {
    (async () => {
      const cma = createClient({ apiAdapter: sdk.cmaAdapter });
      const space = await cma.getSpace(sdk.ids.space);
      const environment = await space.getEnvironment(sdk.ids.environment);

      const [contentTypesResponse, eisResponse, parameters] = await Promise.all([
        environment.getContentTypes(),
        environment.getEditorInterfaces(),
        sdk.app.getParameters(),
      ]);

      const contentTypes = (contentTypesResponse as CollectionResponse<ContentType>).items;
      const editorInterfaces = (eisResponse as CollectionResponse<EditorInterface>).items;

      const compatibleFields = getCompatibleFields(contentTypes);
      const filteredContentTypes = contentTypes.filter((ct) => {
        const fields = compatibleFields[ct.sys.id];
        return fields && fields.length > 0;
      });

      setContentTypes(filteredContentTypes);
      setCompatibleFields(compatibleFields);
      setSelectedFields(editorInterfacesToSelectedFields(editorInterfaces, sdk.ids.app));
      setParameters(toInputParameters(parameterDefinitions, parameters));

      sdk.app.setReady();
    })();
  }, [sdk, parameterDefinitions]);

  const onParameterChange = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    setParameters((prevParameters) => ({
      ...prevParameters,
      [key]: value,
    }));
  };

  const onSelectedFieldsChange = (selectedFields: SelectedFields) => {
    setSelectedFields(selectedFields);
  };

  const renderApp = () => {
    const { ids, hostnames } = sdk;
    const { space, environment } = ids;
    const hasConfigurationOptions = parameterDefinitions && parameterDefinitions.length > 0;

    return (
      <>
        {hasConfigurationOptions && (
          <>
            <Heading>Configuration</Heading>
            <Form>
              {parameterDefinitions.map((def) => {
                const key = `config-input-${def.id}`;

                return (
                  <FormControl key={key} id={key}>
                    <FormControl.Label>{def.name}</FormControl.Label>
                    <TextInput
                      isRequired={def.required}
                      id={key}
                      name={key}
                      maxLength={255}
                      width={def.type === 'Symbol' ? 'large' : 'medium'}
                      type={def.type === 'Symbol' ? 'text' : 'number'}
                      value={parameters[def.id]}
                      onChange={(e) =>
                        onParameterChange(def.id, e as ChangeEvent<HTMLInputElement>)
                      }
                    />
                    <FormControl.HelpText>{def.description}</FormControl.HelpText>
                  </FormControl>
                );
              })}
            </Form>
            <hr className={styles.splitter} />
          </>
        )}
        <Heading>Assign to fields</Heading>
        {contentTypes.length > 0 ? (
          <Paragraph>
            This app can only be used with <strong>Short text</strong> or{' '}
            <strong>Short text, list</strong> fields. Select which fields you’d like to enable for
            this app.
          </Paragraph>
        ) : (
          <>
            <Paragraph>
              This app can only be used with <strong>Short text</strong> or{' '}
              <strong>Short text, list</strong> fields.
            </Paragraph>
            <Note variant="warning">
              There are <strong>no content types with Short text or Short text, list</strong> fields
              in this environment. You can add one in your{' '}
              <TextLink
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
                href={
                  environment === 'master'
                    ? `https://${hostnames.webapp}/spaces/${space}/content_types`
                    : `https://${hostnames.webapp}/spaces/${space}/environments/${environment}/content_types`
                }>
                content model
              </TextLink>{' '}
              and assign it to the app from this screen.
            </Note>
          </>
        )}
        <FieldSelector
          contentTypes={contentTypes}
          compatibleFields={compatibleFields}
          selectedFields={selectedFields}
          onSelectedFieldsChange={onSelectedFieldsChange}
        />
      </>
    );
  };

  return (
    <>
      <div className={styles.background(color)} />
      <div className={styles.body}>
        <Heading>About {name}</Heading>
        <Paragraph>{description}</Paragraph>
        <hr className={styles.splitter} />
        {renderApp()}
      </div>
      <div className={styles.icon}>
        <img src={logo} alt="App logo" />
      </div>
    </>
  );
}
