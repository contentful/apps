import React, { Component } from 'react';
import PropTypes from 'prop-types';
import camelCase from 'lodash.camelcase';
import { Heading, Paragraph } from '@contentful/f36-components';

import { ConfigurationContent } from './ConfigurationContent';
import { InstallationContent } from './InstallationContent';
import { Divider } from '../Divider';
import { styles } from './styles';

import appLogo from './app-logo.svg';

const makeContentType = (contentTypeId, contentTypeName) => ({
  sys: {
    id: contentTypeId,
  },
  name: contentTypeName,
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      required: true,
      type: 'Symbol',
    },
    {
      id: 'image',
      name: 'Image',
      required: true,
      type: 'Link',
      linkType: 'Asset',
    },
    {
      id: 'imageTags',
      name: 'Image tags',
      required: true,
      type: 'Array',
      items: { type: 'Symbol' },
    },
  ],
});

export class AppView extends Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  state = {
    isInstalled: false,
    allContentTypesIds: [],
    contentTypeId: 'imageWithAiTags',
    contentTypeName: 'Image with AI tags',
    isContentTypeIdPristine: true,
  };

  async componentDidMount() {
    const { space, app } = this.props.sdk;

    const [isInstalled, allContentTypes] = await Promise.all([
      app.isInstalled(),
      space.getContentTypes(),
    ]);

    const allContentTypesIds = allContentTypes.items.map(({ sys: { id } }) => id);

    // Following eslint error is caused due to using async/await
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ isInstalled, allContentTypesIds }, () => app.setReady());

    app.onConfigure(this.installApp);
    app.onConfigurationCompleted((err) => {
      if (!err) {
        this.setState({ isInstalled: true });
      }
    });
  }

  installApp = async () => {
    const { sdk } = this.props;
    const { isInstalled, allContentTypesIds, contentTypeId, contentTypeName } = this.state;

    if (isInstalled) {
      sdk.notifier.success('The app is already fully configured.');
      return false;
    }

    if (!contentTypeName) {
      sdk.notifier.error('Provide a name for the content type.');
      return false;
    }

    const isContentTypeIdTaken = allContentTypesIds.includes(contentTypeId);
    if (isContentTypeIdTaken) {
      sdk.notifier.error(
        `ID "${contentTypeId}" is taken. Try a different name for the content type`
      );
      return false;
    }

    let contentType = null;
    try {
      const data = makeContentType(contentTypeId, contentTypeName);
      contentType = await sdk.space.createContentType(data);
    } catch (error) {
      sdk.notifier.error(`Failed to create content type "${contentTypeName}"`);
      return false;
    }

    // Set the newly created content type's state to "Published"
    try {
      await sdk.space.updateContentType(contentType);
    } catch (error) {
      sdk.notifier.error(`Failed to publish content type "${contentTypeName}"`);
      return false;
    }

    return {
      targetState: {
        EditorInterface: {
          [contentType.sys.id]: {
            controls: [{ fieldId: 'imageTags' }],
          },
        },
      },
    };
  };

  onContentTypeNameChange = ({ target: { value } }) =>
    this.setState((oldState) => ({
      ...(oldState.isContentTypeIdPristine && { contentTypeId: camelCase(value) }),
      contentTypeName: value,
    }));

  onContentTypeIdChange = ({ target: { value } }) =>
    this.setState({
      isContentTypeIdPristine: false,
      contentTypeId: value,
    });

  render() {
    const { isInstalled, allContentTypesIds, contentTypeId, contentTypeName } = this.state;

    return (
      <>
        <div className={styles.background} />
        <div className={styles.body}>
          <>
            <Heading className={styles.heading}>About AI Image Tagging</Heading>
            <Paragraph>
              The AI Image Tagging app uses AI and deep learning capabilities to automatically
              assign tags to images. The tags are visible and accessible via the Contentful web app
              entry editor and tags are searchable in the search bar.
            </Paragraph>
            <Divider />
            {isInstalled && <ConfigurationContent />}
            {!isInstalled && (
              <InstallationContent
                allContentTypesIds={allContentTypesIds}
                contentTypeId={contentTypeId}
                contentTypeName={contentTypeName}
                onContentTypeNameChange={this.onContentTypeNameChange}
                onContentTypeIdChange={this.onContentTypeIdChange}
              />
            )}
          </>
        </div>
        <div className={styles.logo}>
          <img src={appLogo} alt="logo" />
        </div>
      </>
    );
  }
}
