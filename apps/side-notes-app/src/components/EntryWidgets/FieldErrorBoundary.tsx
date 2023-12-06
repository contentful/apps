import { Note, TextLink } from '@contentful/f36-components';
import { Component } from 'react';
import { NativeFieldEditorRender } from '../NativeFieldEditorRender';

interface Props {
  contentTypeId: string;
}

interface State {
  hasError: boolean;
}

export class FieldErrorErroBoundary extends Component<Props, State> {
  state: Readonly<State> = {
    hasError: false,
  };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <NativeFieldEditorRender contentTypeId={this.props.contentTypeId} />
          <Note variant="warning" title="Something went wrong">
            There was error rendering your custom widgets — rendering the built-in editor instead.
            <br />
            If the error reoccurs after refreshing the page, please reach out to the developer to
            the{' '}
            <TextLink href="mailto:team-extensibility@contentful.com">the app developer</TextLink>.
          </Note>
        </>
      );
    }

    return <>{this.props.children}</>;
  }
}
