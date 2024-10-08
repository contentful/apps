import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import { GlobalStyles } from '@contentful/f36-core';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <GlobalStyles />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
