import * as React from 'react';

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

interface Props {
  sdk: ConfigAppSDK<AppParameters>;
  parameterDefinitions: ParameterDefinition[];
  validateParameters: ValidateParametersFn;
  logo: string;
  name: string;
  color: string;
  description: string;
}

interface State {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  parameters: Config;
}

export default class AppConfig extends React.Component<Props, State> {
  state = {
    contentTypes: [],
    compatibleFields: {},
    selectedFields: {},
    parameters: toInputParameters(this.props.parameterDefinitions, null),
    verifying: false,
    token: null,
  };

  componentDidMount() {
    this.init();
  }

  init = async () => {
    const { space, app, ids } = this.props.sdk;

    app.onConfigure(this.onAppConfigure);

    const [contentTypesResponse, eisResponse, parameters] = await Promise.all([
      space.getContentTypes(),
      space.getEditorInterfaces(),
      app.getParameters(),
    ]);

    const contentTypes = (contentTypesResponse as CollectionResponse<ContentType>).items;
    const editorInterfaces = (eisResponse as CollectionResponse<EditorInterface>).items;

    const compatibleFields = getCompatibleFields(contentTypes);
    const filteredContentTypes = contentTypes.filter((ct) => {
      const fields = compatibleFields[ct.sys.id];
      return fields && fields.length > 0;
    });

    this.setState(
      {
        contentTypes: filteredContentTypes,
        compatibleFields,
        selectedFields: editorInterfacesToSelectedFields(editorInterfaces, ids.app),
        parameters: toInputParameters(this.props.parameterDefinitions, parameters),
      },
      () => app.setReady()
    );
  };

  onAppConfigure = () => {
    const { parameters, contentTypes, selectedFields } = this.state;
    const error = this.props.validateParameters(parameters);

    if (error) {
      this.props.sdk.notifier.error(error);
      return false;
    }

    return {
      parameters: toAppParameters(this.props.parameterDefinitions, parameters),
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  };

  render() {
    return (
      <>
        <div className={styles.background(this.props.color)} />
        <div className={styles.body}>
          <Heading>About {this.props.name}</Heading>
          <Paragraph>{this.props.description}</Paragraph>
          <hr className={styles.splitter} />
          {this.renderApp()}
        </div>
        <div className={styles.icon}>
          <img src={this.props.logo} alt="App logo" />
        </div>
      </>
    );
  }

  onParameterChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    this.setState((state) => ({
      parameters: { ...state.parameters, [key]: value },
    }));
  };

  onSelectedFieldsChange = (selectedFields: SelectedFields) => {
    this.setState({ selectedFields });
  };

  renderApp() {
    const { contentTypes, compatibleFields, selectedFields, parameters } = this.state;
    const { parameterDefinitions, sdk } = this.props;
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
                  <FormControl id="inputId">
                    <FormControl.Label>{def.name}</FormControl.Label>
                    <TextInput
                      isRequired={def.required}
                      key={key}
                      id={key}
                      name={key}
                      maxLength={255}
                      width={def.type === 'Symbol' ? 'large' : 'medium'}
                      type={def.type === 'Symbol' ? 'text' : 'number'}
                      value={parameters[def.id]}
                      onChange={this.onParameterChange.bind(this, def.id)}
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
          onSelectedFieldsChange={this.onSelectedFieldsChange}
        />
      </>
    );
  }
}
