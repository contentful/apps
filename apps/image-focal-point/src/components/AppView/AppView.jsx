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
      id: 'focalPoint',
      name: 'Focal point',
      required: true,
      type: 'Object',
    },
  ],
});

export class AppView extends Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  state = {
    isInstalled: false,
    allContentTypes: [],
    allContentTypesIds: [],
    contentTypeId: camelCase('Image with Focal Point'),
    contentTypeName: 'Image with Focal Point',
    isContentTypeIdPristine: true,
    useExistingContentType: false,
    selectedExistingContentTypeId: '',
    selectedFocalPointFieldId: '',
    selectedImageFieldId: '',
  };

  async componentDidMount() {
    const { space, app } = this.props.sdk;

    const [isInstalled, allContentTypesResponse] = await Promise.all([
      app.isInstalled(),
      space.getContentTypes(),
    ]);

    const allContentTypes = allContentTypesResponse.items;
    const allContentTypesIds = allContentTypes.map(({ sys: { id } }) => id);

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ isInstalled, allContentTypes, allContentTypesIds }, () => app.setReady());

    app.onConfigure(this.installApp);
    app.onConfigurationCompleted((err) => {
      if (!err) {
        this.setState({ isInstalled: true });
      }
    });
  }

  // Filter content types to only those with both a JSON Object field and an Asset field
  getEligibleContentTypes = () => {
    const { allContentTypes } = this.state;
    return allContentTypes.filter((ct) => {
      const hasObjectField = ct.fields.some((field) => field.type === 'Object');
      const hasAssetField = ct.fields.some(
        (field) => field.type === 'Link' && field.linkType === 'Asset'
      );
      return hasObjectField && hasAssetField;
    });
  };

  installApp = async () => {
    const { sdk } = this.props;
    const {
      isInstalled,
      allContentTypesIds,
      contentTypeId,
      contentTypeName,
      useExistingContentType,
      selectedExistingContentTypeId,
      selectedFocalPointFieldId,
      selectedImageFieldId,
    } = this.state;

    if (isInstalled) {
      sdk.notifier.success('The app is already fully configured.');
      return false;
    }

    // Using an existing content type
    if (useExistingContentType) {
      if (!selectedExistingContentTypeId) {
        sdk.notifier.error('Please select a content type.');
        return false;
      }

      if (!selectedFocalPointFieldId) {
        sdk.notifier.error('Please select a focal point field.');
        return false;
      }

      if (!selectedImageFieldId) {
        sdk.notifier.error('Please select an image field.');
        return false;
      }

      return {
        parameters: {
          imageFieldId: selectedImageFieldId,
        },
        targetState: {
          EditorInterface: {
            [selectedExistingContentTypeId]: {
              controls: [{ fieldId: selectedFocalPointFieldId }],
            },
          },
        },
      };
    }

    // Creating a new content type
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
            controls: [{ fieldId: 'focalPoint' }],
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

  onUseExistingContentTypeChange = (useExisting) =>
    this.setState({
      useExistingContentType: useExisting,
      selectedExistingContentTypeId: '',
      selectedFocalPointFieldId: '',
      selectedImageFieldId: '',
    });

  onSelectedExistingContentTypeChange = (contentTypeId) =>
    this.setState({
      selectedExistingContentTypeId: contentTypeId,
      selectedFocalPointFieldId: '',
      selectedImageFieldId: '',
    });

  onSelectedFocalPointFieldChange = (fieldId) =>
    this.setState({
      selectedFocalPointFieldId: fieldId,
    });

  onSelectedImageFieldChange = (fieldId) =>
    this.setState({
      selectedImageFieldId: fieldId,
    });

  render() {
    const {
      isInstalled,
      allContentTypesIds,
      contentTypeId,
      contentTypeName,
      useExistingContentType,
      selectedExistingContentTypeId,
      selectedFocalPointFieldId,
      selectedImageFieldId,
    } = this.state;

    return (
      <>
        <div className={styles.background} />
        <div className={styles.body}>
          <>
            <Heading className={styles.heading}>About Image Focal Point</Heading>
            <Paragraph>
              The Image Focal Point app allows you to associate focal point data with uploaded image
              assets, to achieve better cropping amongst different devices and screen sizes.
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
                useExistingContentType={useExistingContentType}
                onUseExistingContentTypeChange={this.onUseExistingContentTypeChange}
                eligibleContentTypes={this.getEligibleContentTypes()}
                selectedExistingContentTypeId={selectedExistingContentTypeId}
                onSelectedExistingContentTypeChange={this.onSelectedExistingContentTypeChange}
                selectedFocalPointFieldId={selectedFocalPointFieldId}
                onSelectedFocalPointFieldChange={this.onSelectedFocalPointFieldChange}
                selectedImageFieldId={selectedImageFieldId}
                onSelectedImageFieldChange={this.onSelectedImageFieldChange}
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
