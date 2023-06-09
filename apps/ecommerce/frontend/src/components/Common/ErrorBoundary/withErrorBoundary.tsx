import { FC } from 'react';
import ErrorBoundary from 'components/Common/ErrorBoundary/ErrorBoundary';
import { ErrorComponentProps } from 'types';

function withErrorBoundary<TProps extends JSX.IntrinsicAttributes>(
  Component: FC,
  FallbackComponent: FC<ErrorComponentProps>
) {
  return (props: TProps) => (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

export default withErrorBoundary;
