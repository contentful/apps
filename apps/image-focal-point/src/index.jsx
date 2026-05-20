import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Note } from '@contentful/f36-components';
import { init, locations } from '@contentful/app-sdk';
import './index.css';

import { AppView } from './components/AppView';
import { FocalPointView } from './components/FocalPointView';
import { FocalPointDialog } from './components/FocalPointDialog';
import { getField, isCompatibleImageField } from './utils';

const DEFAULT_IMAGE_FIELD_ID = 'image';

const getImageFieldId = (sdk) => {
  // Get from installation parameters if set, otherwise use default
  return sdk.parameters?.installation?.imageFieldId || DEFAULT_IMAGE_FIELD_ID;
};

export class App extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  detachExternalChangeHandler = null;

  detachImageChangeHandler = null;

  isMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      value: props.sdk.field.getValue() || { focalPoint: null },
      imageFile: null,
    };
  }

  componentDidMount() {
    const { sdk } = this.props;
    this.isMounted = true;
    sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = sdk.field.onValueChanged(this.onExternalChange);
    this.detachImageChangeHandler = this.getImageEntryField()?.onValueChanged?.(this.loadImageFile);
    this.loadImageFile();
  }

  componentWillUnmount() {
    this.isMounted = false;
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
    }
    if (this.detachImageChangeHandler) {
      this.detachImageChangeHandler();
    }
  }

  onExternalChange = (value) => {
    if (value) {
      this.setState({ value });
    }
  };

  onChange = (e) => {
    const value = e.currentTarget.value;
    this.setState({ value });
    if (value) {
      this.props.sdk.field.setValue(value);
    } else {
      this.props.sdk.field.removeValue();
    }
  };

  getImageEntryField() {
    const imageFieldId = getImageFieldId(this.props.sdk);
    return this.props.sdk.entry?.fields?.[imageFieldId];
  }

  findProperLocale() {
    const imageField = this.getImageEntryField();

    return imageField?.locales?.includes(this.props.sdk.field.locale)
      ? this.props.sdk.field.locale
      : this.props.sdk.locales.default;
  }

  getImageFile = async () => {
    const { sdk } = this.props;
    const imageField = this.getImageEntryField();
    const locale = this.findProperLocale();
    const assetId = imageField?.getValue?.(locale)?.sys?.id;

    if (!assetId || !sdk.space?.getAsset) {
      return null;
    }

    const asset = await sdk.space.getAsset(assetId);
    const files = asset?.fields?.file || {};

    return files[locale] ?? files[sdk.locales.default] ?? null;
  };

  isPreviewableImageFile = (file) => !!(file?.url && /image\/.*/.test(file.contentType));

  loadImageFile = async () => {
    try {
      const file = await this.getImageFile();
      if (this.isMounted) {
        this.setState({ imageFile: this.isPreviewableImageFile(file) ? file : null });
      }
    } catch (e) {
      if (this.isMounted) {
        this.setState({ imageFile: null });
      }
    }
  };

  resetFocalPoint = () => {
    this.setState({ value: { focalPoint: null } });
    this.props.sdk.field.removeValue();
  };

  setFocalPoint = (focalPoint) => {
    this.setState(
      (oldState) => ({
        value: {
          ...oldState.value,
          focalPoint,
        },
      }),
      () => this.props.sdk.field.setValue(this.state.value)
    );
  };

  showFocalPointDialog = async () => {
    const {
      sdk: { notifier },
    } = this.props;

    try {
      const file = await this.getImageFile();
      const imageUrl = file?.url;

      if (!imageUrl) {
        notifier.error('Add an image to the entry first');
        return;
      }

      if (!this.isPreviewableImageFile(file)) {
        notifier.error('The uploaded asset must be an image');
        return;
      }

      const focalPoint = await this.props.sdk.dialogs.openCurrentApp({
        width: 1000,
        parameters: {
          file,
          focalPoint: this.state.value.focalPoint,
        },
      });

      if (focalPoint) {
        this.setFocalPoint(focalPoint);
      }
    } catch (e) {
      notifier.error('Add an image to the entry first');
      return;
    }
  };

  render() {
    const { sdk } = this.props;
    const imageFieldId = getImageFieldId(sdk);
    const imageField = getField(sdk.contentType, imageFieldId);
    const isImageField = isCompatibleImageField(imageField);

    if (isImageField) {
      return (
        <FocalPointView
          showFocalPointDialog={this.showFocalPointDialog}
          focalPoint={this.state.value.focalPoint}
          file={this.state.imageFile}
          resetFocalPoint={this.resetFocalPoint}
        />
      );
    }

    return (
      <Note variant="negative">
        Could not find a field of type Asset with the ID &quot;{imageFieldId}&quot;
      </Note>
    );
  }
}

function renderDialog(sdk) {
  const { invocation: otherProps } = sdk.parameters;
  const container = document.createElement('div');
  const CONTAINER_ID = 'focal-point-dialog';

  container.id = CONTAINER_ID;
  document.body.appendChild(container);

  sdk.window.startAutoResizer();

  ReactDOM.render(
    <FocalPointDialog
      sdk={sdk}
      onSave={(data) => sdk.close(data)}
      onClose={() => sdk.close()}
      {...otherProps}
    />,
    document.getElementById(CONTAINER_ID)
  );
}

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    renderDialog(sdk);
  } else if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    ReactDOM.render(<AppView sdk={sdk} />, document.getElementById('root'));
  } else if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
  }
});
