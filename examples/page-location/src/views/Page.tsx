import React, { Component } from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import { MemoryHistory, createMemoryHistory } from 'history';

import { Tab, Tabs, Heading } from '@contentful/forma-36-react-components';
import { PageExtensionSDK, CollectionResponse, ContentType } from 'contentful-ui-extensions-sdk';

import Dashboard from '../components/Dashboard';
import IncompleteEntries from '../components/IncompleteEntries';

interface PageProps {
  sdk: PageExtensionSDK;
}

interface InvocationParams {
  path: string;
}

function NotFound() {
  return <Heading>404</Heading>;
}

export default class Page extends Component<PageProps, { contentTypes: ContentType[] }> {
  history: MemoryHistory;

  constructor(props: PageProps) {
    super(props);

    const invocationParams = props.sdk.parameters.invocation as InvocationParams;

    this.history = createMemoryHistory({
      initialEntries: [invocationParams.path],
    });

    this.history.listen((location) => {
      this.props.sdk.navigator.openCurrentAppPage({ path: location.pathname });
    });

    this.state = {
      contentTypes: [],
    };
  }

  async componentDidMount() {
    // Fetch our content types so we know which data to display.
    const allContentTypes = (await this.props.sdk.space.getContentTypes()) as CollectionResponse<
      ContentType
    >;

    this.setState({ contentTypes: allContentTypes.items });
  }

  render = () => {
    return (
      <div className="page f36-margin--xl">
        <Router history={this.history}>
          <Tabs withDivider>
            <Route
              render={(props) => (
                <>
                  <Tab
                    id="dashboard-tab"
                    selected={props.location.pathname === '/'}
                    onSelect={() => {
                      props.history.push('/');
                    }}>
                    Dashboard
                  </Tab>
                  <Tab
                    id="incomplete-tab"
                    selected={props.location.pathname === '/incomplete'}
                    onSelect={() => {
                      props.history.push('/incomplete');
                    }}>
                    Incomplete entries
                  </Tab>
                </>
              )}
            />
          </Tabs>

          <Switch>
            <Route
              path="/"
              exact
              children={<Dashboard sdk={this.props.sdk} contentTypes={this.state.contentTypes} />}
            />
            <Route
              path="/incomplete"
              exact
              children={
                <IncompleteEntries sdk={this.props.sdk} contentTypes={this.state.contentTypes} />
              }
            />
            <Route render={NotFound} />
          </Switch>
        </Router>
      </div>
    );
  };
}
