import { Component, ErrorInfo, FC, ReactNode } from 'react';
import { ErrorComponentProps } from '../types';
type ErrorState = { hasError: boolean; error: Error | null; info: ErrorInfo | null };
type ErrorProps = { children: ReactNode; FallbackComponent: FC<ErrorComponentProps> };

class ErrorBoundary extends Component<ErrorProps, ErrorState> {
  constructor(props: ErrorProps) {
    super(props);
  }

  state: ErrorState = {
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
          error={this.state.error!}
          errorInfo={this.state.info!}
          resetErrorHandler={this.resetErrorHandler}
        />
      );
    } else {
      return this.props.children;
    }
  }
}

export default ErrorBoundary;
