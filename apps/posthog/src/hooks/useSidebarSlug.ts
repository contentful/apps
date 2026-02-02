import { useMemo } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PostHogConfiguration, ContentTypeSlugConfig } from '../types';

/**
 * Result of the useSidebarSlug hook
 */
export interface UseSidebarSlugResult {
  /** The full page URL for analytics (null if not configured or missing slug) */
  pageUrl: string | null;
  /** The raw slug value from the entry field */
  slug: string | null;
  /** The content type configuration for the current entry (null if not configured) */
  config: ContentTypeSlugConfig | null;
  /** Error message if URL cannot be determined */
  error: string | null;
  /** Whether the current content type has a slug configuration */
  isConfigured: boolean;
}

/**
 * Hook to extract the page URL from the current entry based on content type configuration.
 *
 * This hook:
 * 1. Gets the current entry's content type ID
 * 2. Looks up the content type mapping from installation parameters
 * 3. Extracts the slug from the configured field
 * 4. Combines the slug with the URL prefix to create the full page URL
 *
 * @returns UseSidebarSlugResult with the page URL, slug, configuration, and any errors
 *
 * @example
 * ```tsx
 * const { pageUrl, error, isConfigured } = useSidebarSlug();
 *
 * if (!isConfigured) {
 *   return <Text>Configure content type mapping to view analytics</Text>;
 * }
 *
 * if (error) {
 *   return <Text>{error}</Text>;
 * }
 *
 * // Use pageUrl for analytics queries
 * ```
 */
export function useSidebarSlug(): UseSidebarSlugResult {
  const sdk = useSDK<SidebarAppSDK>();

  return useMemo(() => {
    // Get installation parameters
    const installationParams = sdk.parameters.installation as PostHogConfiguration | undefined;

    // Check if app is configured
    if (!installationParams || !installationParams.contentTypes) {
      return {
        pageUrl: null,
        slug: null,
        config: null,
        error: 'App is not configured. Please configure the app in the settings.',
        isConfigured: false,
      };
    }

    // Get the current entry's content type ID
    const contentTypeId = sdk.contentType.sys.id;

    // Look up the content type configuration
    const contentTypeConfig = installationParams.contentTypes[contentTypeId];

    if (!contentTypeConfig) {
      return {
        pageUrl: null,
        slug: null,
        config: null,
        error: `Content type "${contentTypeId}" is not configured for analytics. Configure the URL mapping in app settings.`,
        isConfigured: false,
      };
    }

    const { slugField, urlPrefix } = contentTypeConfig;

    // Get the slug field value from the entry
    const field = sdk.entry.fields[slugField];

    if (!field) {
      return {
        pageUrl: null,
        slug: null,
        config: contentTypeConfig,
        error: `Slug field "${slugField}" not found on this entry.`,
        isConfigured: true,
      };
    }

    // Get the field value for the default locale
    const defaultLocale = sdk.locales.default;
    const slugValue = field.getValue(defaultLocale);

    if (!slugValue || typeof slugValue !== 'string') {
      return {
        pageUrl: null,
        slug: null,
        config: contentTypeConfig,
        error: 'No slug value found. Enter a slug to view analytics.',
        isConfigured: true,
      };
    }

    // Normalize the URL prefix (ensure it ends with /)
    const normalizedPrefix = urlPrefix.endsWith('/') ? urlPrefix : `${urlPrefix}/`;

    // Normalize the slug (remove leading /)
    const normalizedSlug = slugValue.startsWith('/') ? slugValue.slice(1) : slugValue;

    // Construct the full page URL
    const pageUrl = `${normalizedPrefix}${normalizedSlug}`;

    return {
      pageUrl,
      slug: slugValue,
      config: contentTypeConfig,
      error: null,
      isConfigured: true,
    };
  }, [sdk.parameters.installation, sdk.contentType.sys.id, sdk.entry.fields, sdk.locales.default]);
}

export default useSidebarSlug;
