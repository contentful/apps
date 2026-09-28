import React from 'react';
import { Box, Note, Paragraph } from '@contentful/f36-components';

/**
 * Keeps a fault in the Robots tab from taking the field editor down with it.
 *
 * This matters more than it looks. The Robots panel is given `forceMount`, so its poll and the
 * create it may be making survive a tab switch, which means it really is mounted on every entry
 * that has a Mux video, including for the many installs that will never enable Robots. An unhandled render error here would unmount the whole field
 * extension: no player, no captions, no upload area, for a feature the customer is not using. So
 * the panel is fenced off, and a fault costs exactly the tab it happened in.
 */

interface State {
  error?: Error;
}

export class RobotsErrorBoundary extends React.Component<React.PropsWithChildren<unknown>, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[robots] The Robots tab failed to render', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box marginTop="spacingM" marginBottom="spacingM">
          <Note
            variant="negative"
            title="The Robots tab could not load"
            data-testid="robots-crashed">
            <Paragraph marginBottom="none">
              Everything else on this video still works. Reloading the entry usually clears this —
              if it does not, the details are in the browser console.
            </Paragraph>
          </Note>
        </Box>
      );
    }

    return <>{this.props.children}</>;
  }
}

export default RobotsErrorBoundary;
