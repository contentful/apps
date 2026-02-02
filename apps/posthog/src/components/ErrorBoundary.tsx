/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Prevents the entire app from crashing due to component errors.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Note, Button, Box, Text } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

// ============================================================================
// Types
// ============================================================================

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback component to render on error */
  fallback?: ReactNode;
  /** Optional callback when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional: name of the component/section for error reporting */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: css({
    padding: tokens.spacingL,
    textAlign: 'center',
  }),
  errorDetails: css({
    marginTop: tokens.spacingM,
    padding: tokens.spacingM,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'left',
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontSizeS,
    color: tokens.gray700,
    overflow: 'auto',
    maxHeight: '150px',
  }),
  retryButton: css({
    marginTop: tokens.spacingM,
  }),
};

// ============================================================================
// Component
// ============================================================================

/**
 * Error boundary that catches errors in child components and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary componentName="Analytics">
 *   <AnalyticsDisplay {...props} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <Box className={styles.container} role="alert" aria-live="assertive">
          <Note variant="negative" title="Something went wrong">
            <Text marginBottom="spacingS">
              {componentName
                ? `An error occurred in the ${componentName} component.`
                : 'An unexpected error occurred.'}
            </Text>
            <Text marginBottom="spacingS">Please try again or refresh the page.</Text>
          </Note>

          <Button
            className={styles.retryButton}
            variant="secondary"
            onClick={this.handleRetry}
            aria-label="Retry loading the component">
            Try Again
          </Button>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className={styles.errorDetails} role="log" aria-label="Error details">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <>
                  <br />
                  <br />
                  <strong>Stack:</strong>
                  <pre>{error.stack}</pre>
                </>
              )}
            </div>
          )}
        </Box>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
