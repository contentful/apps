import * as React from 'react';

import { AppExtensionSDK, CollectionResponse } from '@contentful/app-sdk';
import {
  Heading,
  Paragraph,
  Note,
  Form,
  TextLink,
  FormControl,
  Flex,
  TextInput,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

import FieldSelector from './FieldSelector';

import { toInputParameters, toAppParameters } from './parameters';

import {
  getCompatibleFields,
  editorInterfacesToSelectedFields,
  selectedFieldsToTargetState,
  EditorInterface,
  ContentType,
  CompatibleFields,
  SelectedFields,
  FieldsSkuTypes,
} from './fields';

import { Config, Integration, ParameterDefinition, ValidateParametersFn } from '../interfaces';

interface Props {
  sdk: AppExtensionSDK;
  parameterDefinitions: ParameterDefinition[];
  validateParameters: ValidateParametersFn;
  logo: string;
  name: string;
  color: string;
  description: string;
  skuTypes?: Integration['skuTypes'];
}

interface State {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  fieldSkuTypes: FieldsSkuTypes;
  parameters: Config;
  appReady: boolean;
}

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: (color: string) =>
    css({
      display: 'block',
      position: 'absolute',
      zIndex: -1,
      top: 0,
      width: '100%',
      height: '300px',
      backgroundColor: color,
    }),
  section: css({
    margin: `${tokens.spacingXl} 0`,
  }),
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
  icon: css({
    display: 'flex',
    justifyContent: 'center',
    '> img': {
      display: 'block',
      width: '70px',
      margin: `${tokens.spacingXl} 0`,
    },
  }),
};

export default class AppConfig extends React.Component<Props, State> {
  state = {
    contentTypes: [],
    compatibleFields: {},
    selectedFields: {},
    fieldSkuTypes: {},
    parameters: toInputParameters(this.props.parameterDefinitions, null),
    appReady: false,
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
        fieldSkuTypes: (parameters as { skuTypes?: FieldsSkuTypes })?.skuTypes ?? {},
        appReady: true,
      },
      () => app.setReady()
    );
  };

  onAppConfigure = () => {
    const { parameters, contentTypes, selectedFields, fieldSkuTypes } = this.state;
    const error = this.props.validateParameters(parameters);

    if (error) {
      this.props.sdk.notifier.error(error);
      return false;
    }

    const updatedParameters = toAppParameters(this.props.parameterDefinitions, parameters);

    if (this.props.skuTypes !== undefined) {
      updatedParameters.skuTypes = fieldSkuTypes;
    }

    return {
      parameters: updatedParameters,
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

  onFieldSkuTypesChange = (fieldSkuTypes: FieldsSkuTypes): void => {
    this.setState({ fieldSkuTypes });
  };

  renderApp() {
    const { contentTypes, compatibleFields, selectedFields, fieldSkuTypes, parameters, appReady } =
      this.state;
    const { parameterDefinitions, sdk, skuTypes } = this.props;
    const {
      ids: { space, environment },
    } = sdk;
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
                      name={key}
                      width={def.type === 'Symbol' ? 'large' : 'medium'}
                      type={def.type === 'Symbol' ? 'text' : 'number'}
                      maxLength={255}
                      isRequired={def.required}
                      value={parameters[def.id]}
                      onChange={this.onParameterChange.bind(this, def.id)}
                    />
                    <Flex justifyContent="space-between">
                      <FormControl.HelpText>{def.description}</FormControl.HelpText>
                      <FormControl.Counter />
                    </Flex>
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
                    ? `https://app.contentful.com/spaces/${space}/content_types`
                    : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
                }
              >
                content model
              </TextLink>{' '}
              and assign it to the app from this screen.
            </Note>
          </>
        )}
        {appReady && (
          <FieldSelector
            contentTypes={contentTypes}
            compatibleFields={compatibleFields}
            selectedFields={selectedFields}
            onSelectedFieldsChange={this.onSelectedFieldsChange}
            fieldSkuTypes={fieldSkuTypes}
            onFieldSkuTypesChange={this.onFieldSkuTypesChange}
            skuTypes={skuTypes}
          />
        )}
      </>
    );
  }
}
