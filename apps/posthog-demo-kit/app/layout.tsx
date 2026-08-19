import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PostHogProvider } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Demo Blog - PostHog Analytics',
  description: 'A demo blog for testing PostHog analytics with Contentful',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
