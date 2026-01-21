import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Creates a new QueryClient with retries disabled for each test to ensure isolation.
 */
export function createQueryProviderWrapper(): React.ComponentType<{ children: React.ReactNode }> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
}
