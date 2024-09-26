import * as React from 'react';
import sortBy from 'lodash/sortBy';
import {
  Typography,
  Heading,
  Paragraph,
  TextField,
  TextLink,
  Button,
  Select,
  FormLabel,
  TextInput,
  Note,
} from '@contentful/forma-36-react-components';
import styles from './styles';
import { AppConfigParams, AppConfigState, AllContentTypes, ContentTypes } from './typings';
import { getAndUpdateSavedParams } from './utils';
import { CollectionResponse, ContentType, AppState } from '@contentful/app-sdk';

export default class AppConfig extends React.Component<AppConfigParams, AppConfigState> {
  state: AppConfigState = {
    allContentTypes: {},
    contentTypes: {},
    clientId: '',
    viewId: '',
  };

  async componentDidMount() {
    const { sdk } = this.props;

    const [{ items: spaceContentTypes }, savedParams] = await Promise.all([
      sdk.space.getContentTypes() as Promise<CollectionResponse<ContentType>>,
      getAndUpdateSavedParams(sdk),
    ]);

    const allContentTypes = sortBy(spaceContentTypes, 'name').reduce(
      (acc: AllContentTypes, contentType) => {
        const fields = sortBy(
          // use only short text fields of content type
          contentType.fields.filter((f) => f.type === 'Symbol'),
          // sort by field name
          'name'
        );

        if (fields.length) {
          acc[contentType.sys.id] = {
            ...contentType,
            fields,
          };
        }

        return acc;
      },
      {}
    );
    const { contentTypes } = savedParams;

    for (const [type, { slugField }] of Object.entries(contentTypes)) {
      if (
        // if the saved content type is no longer in the list of all available types
        !(type in allContentTypes) ||
        // or the saved slugField is no longer available
        !allContentTypes[type].fields.some((f) => f.id === slugField)
      ) {
        // remove the content type from the list
        delete contentTypes[type];
      }
    }

    // add an incomplete contentType entry if there are none saved
    if (!Object.keys(contentTypes).length) {
      contentTypes[''] = { slugField: '', urlPrefix: '' };
    }

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      {
        allContentTypes,
        contentTypes,
        clientId: savedParams.clientId || '',
        viewId: savedParams.viewId || '',
      },
      () => sdk.app.setReady()
    );

    sdk.app.onConfigure(() => this.configureApp());
  }

  async configureApp() {
    const { contentTypes, clientId, viewId } = this.state;
    const { notifier } = this.props.sdk;

    if (!clientId || !viewId) {
      notifier.error('You must provide both a valid client ID and view ID!');
      return false;
    }

    if (!/^[-a-z0-9]+.apps.googleusercontent.com$/i.test(clientId)) {
      notifier.error("The value given for the client ID doesn't look valid!");
      return false;
    }

    const ctKeys = Object.keys(contentTypes);

    if (!ctKeys.length || !ctKeys[0]) {
      notifier.error('You need to select at least one content type with a slug field!');
      return false;
    }

    if (ctKeys.some((key) => key && !contentTypes[key].slugField)) {
      notifier.error('Please complete or remove the incomplete content type rows!');
      return false;
    }

    const editorInterface = ctKeys.reduce(
      (acc: { [key: string]: Partial<AppState['EditorInterface']> }, id) => {
        const sidebarPosition: { [key: string]: object } = { sidebar: { position: 1 } };

        acc[id] = sidebarPosition;
        return acc;
      },
      {}
    );

    return {
      parameters: {
        contentTypes,
        clientId,
        viewId,
      },
      targetState: {
        EditorInterface: editorInterface,
      },
    };
  }

  getBestSlugField(contentTypeId: string) {
    const { fields } = this.state.allContentTypes[contentTypeId];

    // return the only short text field
    if (fields.length === 1) {
      return fields[0].id;
    }

    // find field that starts with 'slug'
    for (const field of fields) {
      if (/^slug/i.test(field.name)) {
        return field.id;
      }
    }

    return '';
  }

  handleContentTypeChange(prevKey: string, newKey: string) {
    this.setState((prevState) => {
      const contentTypes: ContentTypes = {};

      // remove contentType[prevKey] field and replace with the new contentType
      // key while preserving key order
      for (const [prop, value] of Object.entries(prevState.contentTypes)) {
        if (prop === prevKey) {
          contentTypes[newKey as keyof typeof contentTypes] = {
            slugField: this.getBestSlugField(newKey),
            urlPrefix: value.urlPrefix,
          };
        } else {
          contentTypes[prop] = value;
        }
      }

      return {
        contentTypes,
      };
    });
  }

  handleContentTypeFieldChange(key: string, field: string, value: string) {
    this.setState((prevState) => {
      const prevContentTypes = prevState.contentTypes;
      const curContentTypeProps = prevContentTypes[key];

      return {
        contentTypes: {
          ...prevState.contentTypes,
          [key]: {
            ...curContentTypeProps,
            [field]: value,
          },
        },
      };
    });
  }

  addContentType() {
    this.setState((prevState) => ({
      contentTypes: {
        ...prevState.contentTypes,
        '': { slugField: '', urlPrefix: '' },
      },
    }));
  }

  removeContentType(key: string) {
    this.setState((prevState) => {
      const contentTypes = { ...prevState.contentTypes };

      delete contentTypes[key];

      return { contentTypes };
    });
  }

  render() {
    const { contentTypes, allContentTypes } = this.state;
    const contentTypeEntries = Object.entries(contentTypes);
    const hasSelectedContentTypes = contentTypeEntries.length > 0;

    return (
      <>
        <div className={styles.background} />
        <div className={styles.body}>
          <div>
            <Typography>
              <Heading className={styles.spaced}>About Google Analytics</Heading>

              <Note noteType="negative" title="Deprecation notice" className={styles.spaced}>
                <Paragraph className={styles.slimSpaced}>
                  Google has{' '}
                  <TextLink
                    href="https://developers.googleblog.com/2021/08/gsi-jsweb-deprecation.html"
                    target="_blank"
                    rel="noopener noreferrer">
                    deprecated the library
                  </TextLink>{' '}
                  Contentful uses to link your Contentful space to a Google Analytics dashboard and
                  display page view reports alongside your Contentful entries.
                </Paragraph>

                <Paragraph className={styles.slimSpaced}>
                  As a result,{' '}
                  <strong>
                    the Google Analytics app will no longer function correctly if you're installing
                    it after July 29, 2022
                  </strong>
                  . Existing installations are not affected by this deprecation.
                </Paragraph>

                <Paragraph>
                  <TextLink
                    href="https://www.contentful.com/help/deprecation-notice-google-analytics-app/"
                    target="_blank"
                    rel="noopener noreferrer">
                    Read more details here.
                  </TextLink>
                </Paragraph>
              </Note>

              <Paragraph>
                This app allows you to view pageview analytics of a Contentful entry in the editor
                sidebar. For installation instructions, please refer to the app&apos;s{' '}
                <TextLink
                  href="https://www.contentful.com/developers/docs/extensibility/apps/google-analytics/"
                  target="_blank"
                  rel="noopener noreferrer">
                  documentation
                </TextLink>
                .
              </Paragraph>
            </Typography>
          </div>

          <hr className={styles.splitter} />

          <Typography>
            <Heading className={styles.spaced}>Configuration</Heading>

            <TextField
              labelText="Client ID"
              name="clientId"
              id="clientId"
              required
              value={this.state.clientId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                this.setState({ clientId: event.target.value.trim() })
              }
              helpText="Client ID of the Google Cloud OAuth application"
              className={styles.spaced}
              textInputProps={{
                type: 'text',
                placeholder: 'XXXXXXXX-XXXXXXXX.apps.googleusercontent.com',
              }}
            />
            <TextField
              labelText="View ID"
              required
              name="viewId"
              id="viewId"
              value={this.state.viewId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                this.setState({ viewId: event.target.value.trim() })
              }
              helpText="The ID of the Google Analytics view you want to query"
              textInputProps={{
                type: 'text',
              }}
            />
          </Typography>

          <hr className={styles.splitter} />

          <Typography>
            <Heading className={styles.spaced}>Assign to content types</Heading>
            <Paragraph className={styles.spaced}>
              Select which content types will show the Google Analytics functionality in the
              sidebar. Specify the slug field that is used for URL generation in your application.
              Optionally, specify a prefix for the slug.
            </Paragraph>

            <div className={styles.contentTypeGrid}>
              {hasSelectedContentTypes && (
                <>
                  <FormLabel htmlFor="">Content type</FormLabel>
                  <FormLabel htmlFor="">Slug field</FormLabel>
                  <FormLabel htmlFor="">URL prefix</FormLabel>
                </>
              )}
              <div className={styles.invisible}>Remover</div>
            </div>

            {contentTypeEntries.map(([key, { slugField, urlPrefix }], index) => (
              <div
                key={key}
                className={[styles.contentTypeGrid, styles.contentTypeGridInputs].join(' ')}>
                <Select
                  name={'contentType-' + index}
                  id={'contentType-' + index}
                  value={key}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    this.handleContentTypeChange(key, event.target.value)
                  }>
                  {key ? null : (
                    <option disabled value="">
                      Select a Content Type
                    </option>
                  )}

                  {Object.entries(allContentTypes)
                    // include current type in options (required by Select component)
                    // and all types that are not selected
                    .filter(([type]) => type === key || !contentTypes[type])
                    .map(([type, { name: typeName }]) => (
                      <option key={`${key}->${type}`} value={type}>
                        {typeName}
                      </option>
                    ))}
                </Select>

                <Select
                  name={'slugField-' + index}
                  id={'slugField-' + index}
                  isDisabled={!key}
                  hasError={key ? !slugField : false}
                  value={slugField}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    this.handleContentTypeFieldChange(key, 'slugField', event.target.value)
                  }>
                  <option disabled value="">
                    Select slug field
                  </option>
                  {key &&
                    allContentTypes[key].fields.map((f) => (
                      <option key={`${key}.${f.id}`} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </Select>

                <TextInput
                  name={'urlPrefix-' + index}
                  id={'urlPrefix-' + index}
                  value={urlPrefix}
                  disabled={!key}
                  onChange={(event) =>
                    this.handleContentTypeFieldChange(key, 'urlPrefix', event.target.value)
                  }
                />

                <TextLink onClick={() => this.removeContentType(key)}>Remove</TextLink>
              </div>
            ))}

            <Button
              type="button"
              buttonType="muted"
              disabled={Object.values(contentTypes).some((ct) => !ct.slugField)}
              onClick={() => this.addContentType()}>
              {hasSelectedContentTypes ? 'Add another content type' : 'Add a content type'}
            </Button>
          </Typography>
        </div>

        <div className={styles.logo}>
          <svg height="29" viewBox="0 0 204 29" width="204" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd" transform="translate(-4 -1)">
              <path d="m0 0h30v30h-30z" />
              <g fill-rule="nonzero" transform="translate(4 1)">
                <path
                  d="m17.3684211 3.34090909v21.00000001c0 2.3497727 1.6089473 3.6590909 3.3157894 3.6590909 1.5789474 0 3.3157895-1.1136364 3.3157895-3.6590909v-20.8409091c0-2.15409091-1.5789474-3.5-3.3157895-3.5s-3.3157894 1.48431818-3.3157894 3.34090909z"
                  fill="#f9ab00"
                />
                <g fill="#e37400">
                  <path d="m8.68421053 14v10.3409091c0 2.3497727 1.60894737 3.6590909 3.31578947 3.6590909 1.5789474 0 3.3157895-1.1136364 3.3157895-3.6590909v-10.1818182c0-2.1540909-1.5789474-3.5-3.3157895-3.5s-3.31578947 1.4843182-3.31578947 3.3409091z" />
                  <ellipse cx="3.315789" cy="24.659091" rx="3.315789" ry="3.340909" />
                </g>
              </g>
              <g fill="#5f6368">
                <path
                  d="m119.376 24 1.584-4.334h6.798l1.584 4.334h2.046l-5.984-15.752h-2.112l-5.962 15.752zm7.744-6.094h-5.522l2.09-5.676.616-1.694h.088l.638 1.694zm8.046211 6.094v-6.314c0-.6013333.132-1.177.396-1.727s.634333-.9936667 1.111-1.331c.476666-.3373333 1.015666-.506 1.617-.506.865333 0 1.547333.2346667 2.046.704.498666.4693333.748 1.2246667.748 2.266v6.908h1.87v-7.194c0-1.3493333-.355667-2.4163333-1.067-3.201-.711334-.7846667-1.741667-1.177-3.091-1.177-.762667 0-1.481334.1943333-2.156.583-.674667.3886667-1.166.8616667-1.474 1.419h-.088v-1.65h-1.782v11.22zm14.14021.352c.806667 0 1.532667-.1906667 2.178-.572.645334-.3813333 1.129334-.8433333 1.452-1.386h.088v1.606h1.782v-7.106c0-1.3786667-.436333-2.4676667-1.309-3.267-.872666-.7993333-2.071666-1.199-3.597-1.199-.938666 0-1.793.1906667-2.563.572s-1.375.9093333-1.815 1.584l1.408 1.056c.308-.484.726-.8616667 1.254-1.133s1.107334-.407 1.738-.407c.894667 0 1.635334.253 2.222.759.586667.506.88 1.177.88 2.013v.682c-.308-.1906667-.751666-.3593333-1.331-.506-.579333-.1466667-1.206333-.22-1.881-.22-1.364 0-2.493333.3336667-3.388 1.001-.894666.6673333-1.342 1.595-1.342 2.783 0 .7186667.176 1.3603333.528 1.925s.850667 1.0083333 1.496 1.331c.645334.3226667 1.378667.484 2.2.484zm.176-1.65c-.718666 0-1.312666-.1906667-1.782-.572-.469333-.3813333-.704-.88-.704-1.496 0-.6746667.260334-1.2246667.781-1.65.520667-.4253333 1.294334-.638 2.321-.638.572 0 1.114667.0733333 1.628.22.513334.1466667.946.3373333 1.298.572 0 .6453333-.161333 1.2393333-.484 1.782-.322666.5426667-.755333.9753333-1.298 1.298-.542666.3226667-1.129333.484-1.76.484zm9.982211 1.298v-15.752h-1.87v15.752zm5.824211 4.752 6.93-15.972h-2.024l-3.388 8.338h-.044l-3.52-8.338h-2.024l4.642 10.516-2.508 5.456zm12.996211-4.576c.352 0 .641666-.022.869-.066.227333-.044.450999-.1173333.670999-.22v-1.826c-.395999.2493333-.806666.374-1.232.374-.527999 0-.931333-.1613333-1.209999-.484-.234667-.2933333-.352-.748-.352-1.364v-6.116h2.727999v-1.694h-2.727999v-3.168h-1.87v3.168h-1.958v1.694h1.958v6.578c0 .528.073333.9753333.22 1.342.146666.3666667.366666.6893333.66.968.263999.2493333.590333.4473333.979.594.388666.1466667.810333.22 1.265.22zm5.14221-13.464c.381334 0 .700334-.132.957-.396.256667-.264.385-.57933333.385-.946s-.132-.67833333-.396-.935-.579333-.385-.946-.385c-.366666 0-.682.12833333-.946.385s-.396.56833333-.396.935.132.682.396.946.579334.396.946.396zm.924 13.288v-11.22h-1.848v11.22zm8.112211.352c1.202667 0 2.225667-.286 3.069-.858s1.455667-1.32 1.837-2.244l-1.672-.704c-.278667.6746667-.704 1.1953333-1.276 1.562s-1.254.55-2.046.55c-.66 0-1.276-.1796667-1.848-.539s-1.030333-.8616667-1.375-1.507-.517-1.386-.517-2.222.172333-1.5766667.517-2.222.803-1.1476667 1.375-1.507 1.188-.539 1.848-.539c.777333 0 1.441.1796667 1.991.539s.964333.8836667 1.243 1.573l1.694-.704c-.352-.9386667-.942333-1.6903333-1.771-2.255s-1.851667-.847-3.069-.847c-1.085333 0-2.060667.2566667-2.926.77s-1.54 1.2246667-2.024 2.134-.726 1.9286667-.726 3.058.242 2.145.726 3.047 1.158667 1.6133333 2.024 2.134 1.840667.781 2.926.781zm11.038211 0c.821333 0 1.569333-.1393333 2.244-.418.674666-.2786667 1.21-.6783333 1.606-1.199s.594-1.1256667.594-1.815c0-.792-.278667-1.463-.836-2.013-.557334-.55-1.386-.9643333-2.486-1.243l-1.628-.418c-.645334-.1613333-1.129334-.3703333-1.452-.627-.322667-.2566667-.484-.5903333-.484-1.001 0-.44.231-.803.693-1.089s1.001-.429 1.617-.429c1.276 0 2.163333.4986667 2.662 1.496l1.628-.748c-.322667-.7626667-.869-1.3566667-1.639-1.782s-1.646334-.638-2.629-.638c-.748 0-1.444667.132-2.09.396-.645334.264-1.162334.6416667-1.551 1.133-.388667.4913333-.583 1.0596667-.583 1.705 0 .836.286 1.518.858 2.046s1.305333.902 2.2 1.122l1.364.352c.850666.2053333 1.474.451 1.87.737s.594.6636667.594 1.133c0 .528-.249334.935-.748 1.221-.498667.286-1.1.429-1.804.429-.66 0-1.265-.1833333-1.815-.55s-.964334-.8873333-1.243-1.562l-1.672.748c.337333.88.909333 1.6023333 1.716 2.167.806666.5646667 1.811333.847 3.014.847z"
                  fill-rule="nonzero"
                />
                <path
                  d="m62.7979946 12.0223604 5.0530633-2.09884691c-.2788329-.70652763-1.1125439-1.19825529-2.0979044-1.19825529-1.2632708 0-3.0182894 1.11346636-2.9551589 3.2971022m5.9310338 2.0338514 1.9264614 1.2839867c-.6198536.9213076-2.1195829 2.5058057-4.7101775 2.5058057-3.2104482 0-5.5297302-2.4841472-5.5297302-5.6522009 0-3.36306029 2.340018-5.65314352 5.2518399-5.65314352 2.9334804 0 4.3681942 2.33436278 4.8382834 3.59763362l.2571744.6424546-7.5579264 3.1256593c.5784017 1.1351449 1.4771082 1.7126241 2.740379 1.7126241 1.2623082 0 2.1412413-.6217387 2.783716-1.5637822m-12.2483305 3.4478492h2.4832047v-16.61461951h-2.4832047zm-4.0516795-5.2885591c0-1.9905144-1.3282663-3.44690669-3.0192119-3.44690669-1.7116815 0-3.1473378 1.45637219-3.1473378 3.44690669 0 1.9697984 1.4356563 3.4045121 3.1463953 3.4045121 1.691868 0 3.0201544-1.4347337 3.0201544-3.4045121zm2.1826933-5.33097367v10.14852097c0 4.1750928-2.4615261 5.8886394-5.3733481 5.8886394-2.7413215 0-4.3898726-1.8416726-5.0097262-3.3404392l2.1619573-.8996491c.3862428.920365 1.3282663 2.0121729 2.8477689 2.0121729 1.8623885 0 3.0192119-1.1558809 3.0192119-3.3178382v-.8139176h-.0857315c-.5567432.6848491-1.6278351 1.2849294-2.9768174 1.2849294-2.8260904 0-5.416685-2.4624687-5.416685-5.631465 0-3.18971222 2.5905946-5.67385942 5.416685-5.67385942 1.3490023 0 2.4200742.59913767 2.9768174 1.26327083h.084789v-.92036498c-.0000201 0 2.3550787 0 2.3550787 0zm-27.1022762 5.31023767c0-2.034794-1.450737-3.42617069-3.1322571-3.42617069-1.6815401 0-3.1322571 1.39231929-3.1322571 3.42617069 0 2.0121728 1.450737 3.4252281 3.1322571 3.4252281 1.6815402 0 3.1322571-1.4130352 3.1322571-3.4252281m2.4379826 0c0 3.2537852-2.501093 5.6522009-5.5702397 5.6522009s-5.5702396-2.3984157-5.5702396-5.6522009c0-3.27638627 2.5010929-5.65220097 5.5702396-5.65220097 3.0691267 0 5.5702397 2.37487215 5.5702397 5.65220097m10.0505364 0c0-2.034794-1.450737-3.42617069-3.1322571-3.42617069-1.6815401 0-3.1322571 1.39231929-3.1322571 3.42617069 0 2.0121728 1.450737 3.4252281 3.1322571 3.4252281s3.1322571-1.4130352 3.1322571-3.4252281m2.4389251 0c0 3.2537852-2.5020355 5.6522009-5.5711822 5.6522009s-5.5702396-2.3984157-5.5702396-5.6522009c0-3.27638627 2.5010929-5.65220097 5.5702396-5.65220097s5.5711822 2.37487215 5.5711822 5.65220097m-33.17461142 5.6522009c-4.83734082 0-8.90598616-3.9395768-8.90598616-8.77786021 0-4.83922591 4.06864534-8.77974531 8.9069287-8.77974531 2.67724858 0 4.58205158 1.05035596 6.01676528 2.42101674l-1.6918881 1.69094555c-1.0277549-.96370199-2.4191317-1.71262408-4.32487718-1.71262408-3.53261807 0-6.29559811 2.84776898-6.29559811 6.38038704 0 3.53261807 2.76298004 6.37944447 6.29559811 6.37944447 2.29102578 0 3.59667098-.920365 4.43226708-1.755941.6848491-.6839066 1.1351449-1.6692871 1.3056653-3.0182693h-5.73885487v-2.39747321h8.07133257c.0866741.42767472.1290685.94202346.1290685 1.49782412 0 1.79927809-.4926902 4.02625089-2.0762458 5.61074899-1.5421438 1.6052342-3.5119222 2.4615462-6.12417532 2.4615462"
                  transform="translate(40 7)"
                />
              </g>
            </g>
          </svg>
        </div>
      </>
    );
  }
}
