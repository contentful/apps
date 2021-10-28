import React from 'react';
import PropTypes from 'prop-types';
import {
  CheckboxField,
  TextInput,
  Pill,
  Button,
  Note,
} from '@contentful/forma-36-react-components';
import get from 'lodash.get';

import { styles } from './styles';

async function callAPI(url) {
  const res = await fetch(`/tags/${url}`);
  const data = await res.json();
  return data.tags;
}

export class AITagView extends React.Component {
  static propTypes = {
    entries: PropTypes.object.isRequired,
    notifier: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
    space: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      value: '',
      tags: props.entries.imageTags.getValue() || [],
      overwrite: true,
      isMissingImage: !props.entries.image.getValue(),
      unsupportedImageType: false,
      imageRequirementsNotMet: false,
      isFetchingTags: false,
    };

    this.validateImage();
  }

  componentDidMount() {
    this.props.entries.image.onValueChanged(() => {
      this.setState(() => ({
        isMissingImage: !this.props.entries.image.getValue(),
      }));
      // always validate the image
      this.validateImage();
    });
  }

  validateImage = async () => {
    const MAX_FILE_SIZE = 5 * Math.pow(2, 20); // 5MB limit from AWS Rekognition
    const MIN_DIMENSION_SIZE = 80; // 80px limit
    const imageId = get(this.props.entries.image.getValue(), 'sys.id');
    if (!imageId) {
      return;
    }

    const file = await this.props.space.getAsset(imageId);
    const locale = this.props.locale;
    const contentType = get(file, `fields.file.${locale}.contentType`);
    const details = get(file, `fields.file.${locale}.details`);
    // test if file extension is PNG/JPEG/JPG
    const isImageTypeValid = new RegExp(/^image\/(png|jpe?g)$/, 'i').test(contentType);
    const isImageIncompatible =
      details.size > MAX_FILE_SIZE ||
      details.width < MIN_DIMENSION_SIZE ||
      details.height < MIN_DIMENSION_SIZE;

    this.setState(() => ({
      unsupportedImageType: !isImageTypeValid,
      imageRequirementsNotMet: isImageIncompatible,
    }));
  };

  toggleOverwrite = () => {
    this.setState((state) => ({
      overwrite: !state.overwrite,
    }));
  };

  updateTags = async (tags) => {
    const tagsWithoutDuplicates = [...new Set(tags)];
    await this.props.entries.imageTags.setValue(tagsWithoutDuplicates);
    this.setState(() => ({
      tags: tagsWithoutDuplicates,
    }));
  };

  addTag = async (e) => {
    if (e.key !== 'Enter' || !e.target.value) {
      return;
    }

    await this.updateTags([e.target.value, ...this.state.tags]);
    this.setState(() => ({
      value: '',
    }));
  };

  deleteTag = async (tag) => {
    const newTags = this.state.tags.filter((t) => t !== tag);
    await this.updateTags(newTags);
  };

  fetchTags = async () => {
    const imageId = get(this.props.entries.image.getValue(), 'sys.id');
    const file = await this.props.space.getAsset(imageId);
    const locale = this.props.locale;
    const fullURL = get(file, `fields.file.${locale}.url`);
    const imagePath = new URL(`${window.location.protocol}${fullURL}`).pathname;
    this.setState({ isFetchingTags: true });

    try {
      const aiTags = await callAPI(imagePath);

      // upload new tags
      const newTags = this.state.overwrite ? aiTags : [...aiTags, ...this.state.tags];
      this.updateTags(newTags);
    } catch (e) {
      this.props.notifier.error('Image Tagging failed. Please try again later.');
    } finally {
      this.setState(() => ({ isFetchingTags: false }));
    }
  };

  updateValue = (e) => {
    this.setState({
      value: e.target.value,
    });
  };

  render() {
    let hasImageError =
      !this.state.isMissingImage &&
      (this.state.unsupportedImageType || this.state.imageRequirementsNotMet);
    let imageErrorMsg = this.state.unsupportedImageType
      ? 'Unfortunately, we can only auto-tag PNG and JPG file types'
      : 'Please make sure your image is less than 5MB and has dimensions of at least 80px for both width and height';

    return (
      <div className={styles.inputWrapper}>
        <TextInput
          testId="image-tag"
          placeholder="Type a tag and press enter"
          width="large"
          disabled={this.state.isMissingImage}
          value={this.state.value}
          onChange={this.updateValue}
          onKeyPress={this.addTag}
        />
        <div className={styles.pillWrapper}>
          {this.state.tags.map((tag, index) => (
            <Pill
              className={styles.pill}
              key={`${tag}-${index}`}
              label={tag}
              onClose={this.deleteTag.bind(this, tag)}
            />
          ))}
        </div>
        {hasImageError && (
          <Note noteType="warning" className={styles.fileWarning}>
            {imageErrorMsg}
          </Note>
        )}
        <Button
          id="fetch-tag-btn"
          className={styles.btn}
          buttonType="primary"
          type="button"
          disabled={this.state.isMissingImage || hasImageError}
          loading={this.state.isFetchingTags}
          onClick={this.fetchTags}
        >
          Auto-tag from AI
        </Button>
        <CheckboxField
          id="overwrite-tags"
          labelText="Overwrite existing tags"
          disabled={this.state.isMissingImage || hasImageError}
          checked={this.state.overwrite}
          onChange={this.toggleOverwrite}
        />
      </div>
    );
  }
}
