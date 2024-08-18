import React, { ChangeEvent, useState, useEffect } from 'react';

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

import {
  AppParameters,
  Config,
  ParameterDefinition,
  ValidateParametersFn,
} from '../interfaces';

import { styles } from './AppConfig.styles';

interface Props {
  sdk: ConfigAppSDK<AppParameters>;
  parameterDefinitions: ParameterDefinition[];
  validateParameters: ValidateParametersFn;
  logo: string;
  name: string;
  color: string;
  description: string;
}

export default function AppConfig(props: Props) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [compatibleFields, setCompatibleFields] = useState<CompatibleFields>(
    {},
  );
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});
  const [parameters, setParameters] = useState<Config>(
    toInputParameters(props.parameterDefinitions, null),
  );

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { space, app, ids } = props.sdk;

    app.onConfigure(onAppConfigure);

    const [contentTypesResponse, eisResponse, parameters] = await Promise.all([
      space.getContentTypes(),
      space.getEditorInterfaces(),
      app.getParameters(),
    ]);

    const contentTypes = (
      contentTypesResponse as CollectionResponse<ContentType>
    ).items;
    const editorInterfaces = (
      eisResponse as CollectionResponse<EditorInterface>
    ).items;

    const compatibleFields = getCompatibleFields(contentTypes);
    const filteredContentTypes = contentTypes.filter((ct) => {
      const fields = compatibleFields[ct.sys.id];
      return fields && fields.length > 0;
    });

    setContentTypes(filteredContentTypes);
    setCompatibleFields(compatibleFields);
    setSelectedFields(
      editorInterfacesToSelectedFields(editorInterfaces, ids.app),
    );
    setParameters(toInputParameters(props.parameterDefinitions, parameters));

    app.setReady();
  };

  const onAppConfigure = () => {
    const error = props.validateParameters(parameters);

    if (error) {
      props.sdk.notifier.error(error);
      return false;
    }

    return {
      parameters: toAppParameters(props.parameterDefinitions, parameters),
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  };

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
    const { parameterDefinitions, sdk } = props;
    const { ids, hostnames } = sdk;
    const { space, environment } = ids;
    const hasConfigurationOptions =
      parameterDefinitions && parameterDefinitions.length > 0;

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
                      key={key}
                      id={key}
                      name={key}
                      maxLength={255}
                      width={def.type === 'Symbol' ? 'large' : 'medium'}
                      type={def.type === 'Symbol' ? 'text' : 'number'}
                      value={`${parameters[def.id]}`}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onParameterChange(def.id, e)
                      }
                    />
                    <FormControl.HelpText>
                      {def.description}
                    </FormControl.HelpText>
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
            <strong>Short text, list</strong> fields. Select which fields you’d
            like to enable for this app.
          </Paragraph>
        ) : (
          <>
            <Paragraph>
              This app can only be used with <strong>Short text</strong> or{' '}
              <strong>Short text, list</strong> fields.
            </Paragraph>
            <Note variant="warning">
              There are{' '}
              <strong>
                no content types with Short text or Short text, list
              </strong>{' '}
              fields in this environment. You can add one in your{' '}
              <TextLink
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
                href={
                  environment === 'master'
                    ? `https://${hostnames.webapp}/spaces/${space}/content_types`
                    : `https://${hostnames.webapp}/spaces/${space}/environments/${environment}/content_types`
                }
              >
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
      <div className={styles.background(props.color)} />
      <div className={styles.body}>
        <Heading>About {props.name}</Heading>
        <Paragraph>{props.description}</Paragraph>
        <hr className={styles.splitter} />
        {renderApp()}
      </div>
      <div className={styles.icon}>
        <img src={props.logo} alt="App logo" />
      </div>
    </>
  );
}
