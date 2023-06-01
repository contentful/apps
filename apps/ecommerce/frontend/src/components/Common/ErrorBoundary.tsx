import { Component, ErrorInfo } from 'react';
import type { ErrorBoundaryState, ErrorBoundaryProps } from 'types';

// In order for error boundaries to work, they must be a class component.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    info: null,
  };

  static getDerivedStateFromError(error: Error, info: ErrorInfo) {
    return { hasError: true, error, info };
  }

  resetErrorHandler = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (this.state.hasError) {
      const { FallbackComponent } = this.props;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.info}
          resetErrorHandler={this.resetErrorHandler}
        />
      );
    } else {
      return this.props.children;
    }
  }
}

export default ErrorBoundary;
