import React, { Component, ReactNode } from 'react';
import { Box, Heading, Note, Paragraph } from '@contentful/f36-components';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error boundary component to catch and display React errors
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box padding="spacingXl">
          <Note variant="negative" title="Application Error">
            <Paragraph>
              An unexpected error occurred. Please refresh the page and try again.
            </Paragraph>
            {this.state.error && (
              <Paragraph>
                <strong>Error:</strong> {this.state.error.message}
              </Paragraph>
            )}
          </Note>
        </Box>
      );
    }

    return this.props.children;
  }
}

interface PageShellProps {
  children: ReactNode;
  title?: string;
}

/**
 * Page shell component with error boundary
 */
export function PageShell({ children, title = 'CSV Import' }: PageShellProps) {
  return (
    <ErrorBoundary>
      <Box padding="spacingXl">
        {title && (
          <Heading as="h1" marginBottom="spacingM">
            {title}
          </Heading>
        )}
        {children}
      </Box>
    </ErrorBoundary>
  );
}
