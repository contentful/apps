import { FC } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Fallback from '../components/Fallback';

function withErrorBoundary<TProps extends JSX.IntrinsicAttributes>(Component: FC) {
  return (props: TProps) => (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

export default withErrorBoundary;
