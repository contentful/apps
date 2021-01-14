import React from 'react';
import { render } from 'react-dom';
import { init, locations } from '@contentful/app-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

import { AppView } from './components/AppView';
import { AITagView } from './components/AITagView';

init(sdk => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<AppView sdk={sdk} />, document.getElementById('root'));
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    sdk.window.startAutoResizer();

    render(
      <AITagView
        entries={sdk.entry.fields}
        space={sdk.space}
        locale={sdk.locales.default }
        notifier={sdk.notifier }
      />,
      document.getElementById('root')
    );
  }
});
