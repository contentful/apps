'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * PostHog Provider component that initializes tracking
 * and captures pageviews automatically on route changes
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog only on the client side
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        // Capture pageviews automatically
        capture_pageview: false, // We'll handle this manually for more control
        capture_pageleave: true,
        // Enable session recording
        disable_session_recording: false,
        // Respect Do Not Track
        respect_dnt: true,
        // Load feature flags on initialization
        bootstrap: {},
        loaded: (posthog) => {
          // Enable debug mode in development
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        },
      });
    }
  }, []);

  // Track pageviews on route changes
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }

      // Capture the pageview with the full URL
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/**
 * Hook to track custom events
 * Usage: const { trackEvent } = usePostHog();
 *        trackEvent('clicked_cta_button', { button_text: 'Sign Up' });
 */
export function usePostHogEvents() {
  const trackEvent = (
    eventName: string,
    properties?: Record<string, string | number | boolean>
  ) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
    if (posthog) {
      posthog.identify(userId, traits);
    }
  };

  return { trackEvent, identifyUser, posthog };
}
