import React from 'react';
import PropTypes from 'prop-types';
import { render } from 'react-dom';
import { init, locations } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

import { AppView } from './components/AppView';
import { AITagView } from './components/AITagView';

export class App extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.app = this.props.sdk.app;
  }

  async componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    this.app.setReady();
  }

  render() {
    return (
      <AITagView
        entries={this.props.sdk.entry.fields}
        space={ this.props.sdk.space}
        locale={ this.props.sdk.locales.default }
        notifier={ this.props.sdk.notifier }
      />
    );
  }
}

init(sdk => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<AppView sdk={sdk} />, document.getElementById('root'));
  } else if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    render(<App sdk={sdk} />, document.getElementById('root'));
  }
});
