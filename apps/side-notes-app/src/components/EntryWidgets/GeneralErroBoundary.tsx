import { Note, TextLink } from '@contentful/f36-components';
import { Component, ReactElement } from 'react';

interface Props {
  // nothing
}

interface State {
  hasError: boolean;
}

export class GeneralErrorBoundary extends Component<Props, State> {
  state: Readonly<State> = {
    hasError: false,
  };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Note variant="warning" title="Something went wrong">
          There was error rendering your custom widgets.
          <br />
          If the error reoccurs after refreshing the page, please reach out to the developer to the{' '}
          <TextLink href="mailto:team-extensibility@contentful.com">the app developer</TextLink>.
        </Note>
      );
    }

    return <>{this.props.children}</>;
  }
}
