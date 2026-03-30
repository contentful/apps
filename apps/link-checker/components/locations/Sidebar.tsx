import React, { useCallback, useState } from 'react';
import {
  Paragraph,
  Button,
  Spinner,
  Flex,
  Box,
  Text,
  Checkbox,
} from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { extractUrlsFromEntry, isRelativeUrl, type ExtractedUrl } from '@/utils/extractUrls';
import type { AppInstallationParameters } from './ConfigScreen';

const CHECK_LINK_FUNCTION_ID = 'checkLink';
const CONCURRENCY = 3;

export interface LinkCheckResult {
  url: string;
  /** When present, this is the absolute URL used for the check (e.g. resolved from relative). Use for href. */
  resolvedUrl?: string;
  fieldId: string;
  fieldName: string;
  locale: string;
  status?: number;
  error?: string;
  isBlockedByAllowList: boolean;
  isOnDenyList: boolean;
  isValid: boolean;
}

/** 2xx status codes (e.g. 200 OK, 204 No Content) indicate success. */
function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function isUrlOnDenyList(url: string, patterns: string[]): boolean {
  if (!patterns.length) return false;
  const normalized = url.toLowerCase();
  return patterns.some((p) => p.trim() && normalized.includes(p.trim().toLowerCase()));
}

function isUrlAllowedByAllowList(url: string, patterns: string[]): boolean {
  if (!patterns.length) return true;
  const normalized = url.toLowerCase();
  return patterns.some((p) => p.trim() && normalized.includes(p.trim().toLowerCase()));
}

export default function Sidebar() {
  const sdk = useSDK<SidebarAppSDK>();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<LinkCheckResult[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [noUrlsFound, setNoUrlsFound] = useState(false);
  const [functionUnavailable, setFunctionUnavailable] = useState(false);
  const [relativeLinksSkipped, setRelativeLinksSkipped] = useState(0);

  const installation = (sdk.parameters.installation || {}) as AppInstallationParameters;
  const allowedPatterns = (installation.allowedUrlPatterns || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const forbiddenPatterns = (installation.forbiddenUrlPatterns || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const baseUrl = (installation.baseUrl || '').trim().replace(/\/$/, '') || null;

  useAutoResizer();

  const runCheck = useCallback(async () => {
    const extracted = extractUrlsFromEntry(sdk.entry);

    /** URLs we will actually check: original + resolved absolute URL for the request. Relative links without baseUrl are skipped. */
    const toCheck: (ExtractedUrl & { urlToCheck: string })[] = [];
    let relativeSkipped = 0;
    for (const item of extracted) {
      if (isRelativeUrl(item.url)) {
        if (!baseUrl) {
          relativeSkipped++;
          continue;
        }
        try {
          const absolute = new URL(item.url, baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`).href;
          toCheck.push({ ...item, urlToCheck: absolute });
        } catch {
          relativeSkipped++;
        }
      } else {
        toCheck.push({ ...item, urlToCheck: item.url });
      }
    }

    if (toCheck.length === 0) {
      setResults([]);
      setRelativeLinksSkipped(relativeSkipped);
      setNoUrlsFound(true);
      return;
    }

    setNoUrlsFound(false);
    setRelativeLinksSkipped(relativeSkipped);
    setLoading(true);
    setProgress({ done: 0, total: toCheck.length });
    setResults([]);

    const newResults: LinkCheckResult[] = [];
    let done = 0;

    let resolvedActionId: string | null = null;
    const appDefinitionId = sdk.ids.app;
    const organizationId = sdk.ids.organization;

    const matchCheckLinkAction = (a: {
      function?: { sys?: { id?: string } };
      sys?: { id?: string; appDefinition?: { sys?: { id?: string }; id?: string } };
    }): boolean => {
      const functionId = a.function?.sys?.id;
      if (functionId !== CHECK_LINK_FUNCTION_ID) return false;
      if (!appDefinitionId) return true;
      const appDefId = a.sys?.appDefinition?.sys?.id ?? a.sys?.appDefinition?.id;
      return appDefId === appDefinitionId;
    };

    if (sdk.cma?.appAction) {
      try {
        if (organizationId && appDefinitionId && sdk.cma.appAction.getMany) {
          const { items } = await sdk.cma.appAction.getMany({
            organizationId,
            appDefinitionId,
          });
          const checkAction = items?.find((a: unknown) => matchCheckLinkAction(a as Parameters<typeof matchCheckLinkAction>[0]));
          if (checkAction?.sys?.id) resolvedActionId = checkAction.sys.id;
        }
        if (!resolvedActionId && sdk.cma.appAction.getManyForEnvironment) {
          const { items } = await sdk.cma.appAction.getManyForEnvironment({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
          });
          const checkAction = items?.find((a: unknown) => matchCheckLinkAction(a as Parameters<typeof matchCheckLinkAction>[0]));
          if (checkAction?.sys?.id) resolvedActionId = checkAction.sys.id;
        }
      } catch {
        // App Action lookup failed; resolvedActionId remains null
      }
    }

    if (!resolvedActionId || !sdk.cma?.appActionCall?.createWithResponse) {
      setLoading(false);
      setProgress(null);
      setFunctionUnavailable(true);
      return;
    }
    setFunctionUnavailable(false);

    const processOne = async (item: ExtractedUrl & { urlToCheck: string }): Promise<LinkCheckResult> => {
      const isAllowed = isUrlAllowedByAllowList(item.urlToCheck, allowedPatterns);
      const onDenyList = isUrlOnDenyList(item.urlToCheck, forbiddenPatterns);
      const resolvedUrl = item.urlToCheck !== item.url ? item.urlToCheck : undefined;

      if (!isAllowed) {
        return {
          url: item.url,
          resolvedUrl,
          fieldId: item.fieldId,
          fieldName: item.fieldName,
          locale: item.locale,
          isBlockedByAllowList: true,
          isOnDenyList: false,
          isValid: false,
        };
      }

      if (onDenyList) {
        return {
          url: item.url,
          resolvedUrl,
          fieldId: item.fieldId,
          fieldName: item.fieldName,
          locale: item.locale,
          isBlockedByAllowList: false,
          isOnDenyList: true,
          isValid: false,
        };
      }

      try {
        const response = await sdk.cma!.appActionCall!.createWithResponse(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            appDefinitionId: sdk.ids.app!,
            appActionId: resolvedActionId!,
          },
          { parameters: { url: item.urlToCheck } }
        );
        const body = (response as { response?: { body?: string } })?.response?.body;
        if (body) {
          try {
            const data = JSON.parse(body) as { status?: number; error?: string };
            if (typeof data.status === 'number') {
              return {
                url: item.url,
                resolvedUrl,
                fieldId: item.fieldId,
                fieldName: item.fieldName,
                locale: item.locale,
                status: data.status,
                isBlockedByAllowList: false,
                isOnDenyList: false,
                isValid: isSuccessStatus(data.status),
              };
            }
            if (data.error) {
              return {
                url: item.url,
                resolvedUrl,
                fieldId: item.fieldId,
                fieldName: item.fieldName,
                locale: item.locale,
                error: data.error,
                isBlockedByAllowList: false,
                isOnDenyList: false,
                isValid: false,
              };
            }
          } catch {
            // Response body parse failed
          }
        }
      } catch (actionErr) {
        const message = actionErr instanceof Error ? actionErr.message : 'Request failed';
        return {
          url: item.url,
          resolvedUrl,
          fieldId: item.fieldId,
          fieldName: item.fieldName,
          locale: item.locale,
          error: message,
          isBlockedByAllowList: false,
          isOnDenyList: false,
          isValid: false,
        };
      }

      return {
        url: item.url,
        resolvedUrl,
        fieldId: item.fieldId,
        fieldName: item.fieldName,
        locale: item.locale,
        error: 'No response from App Function',
        isBlockedByAllowList: false,
        isOnDenyList: false,
        isValid: false,
      };
    };

    const runWithConcurrency = async () => {
      const queue = [...toCheck];
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;
          const result = await processOne(item);
          newResults.push(result);
          done += 1;
          setProgress((p) => (p ? { ...p, done } : null));
          setResults([...newResults]);
        }
      });
      await Promise.all(workers);
    };

    await runWithConcurrency();
    setLoading(false);
    setProgress(null);
    setResults(newResults);
    setNoUrlsFound(false);
  }, [sdk, allowedPatterns, forbiddenPatterns, baseUrl]);

  const invalidResults = results.filter((r) => !r.isValid);
  const hasInvalid = invalidResults.length > 0;

  return (
    <Flex
      flexDirection="column"
      gap="spacingS"
      as="section"
      aria-label="Link checker"
    >
      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={runCheck}
        isDisabled={loading || functionUnavailable}
        aria-label={functionUnavailable ? 'Link checking is unavailable; App Action is not configured' : undefined}
      >
        {loading ? 'Checking…' : 'Check links'}
      </Button>

      {!loading && relativeLinksSkipped > 0 && (
        <Text as="p" fontSize="fontSizeS" fontColor="gray600">
          {relativeLinksSkipped} relative link{relativeLinksSkipped !== 1 ? 's' : ''} skipped. Set <strong>Current domain (base URL)</strong> in app config to check them.
        </Text>
      )}
      {loading && progress && (
        <Box>
          <Text as="p" fontColor="gray600">
            Checking link: {progress.done} / {progress.total}
          </Text>
          <Spinner size="small" />
        </Box>
      )}

      {!loading && results.length > 0 && (
        <Box aria-live="polite" aria-atomic="true">
          <Box>
            {hasInvalid ? (
              <Text as="p" fontColor="red600">
                {invalidResults.length} invalid link{invalidResults.length !== 1 ? 's' : ''}
              </Text>
            ) : (
              <Text as="p" fontColor="green600">
                All links are valid.
              </Text>
            )}
          </Box>

          {hasInvalid && (
            <Box>
              <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
                Invalid links
              </Text>
              <Flex flexDirection="column" gap="spacingXs">
                {invalidResults.map((r, i) => (
                  <Box key={`${r.url}-${r.fieldId}-${r.locale}-${i}`}>
                    <a href={r.resolvedUrl ?? r.url} target="_blank" rel="noopener noreferrer">
                      {r.url}
                    </a>
                    <Text as="p" fontSize="fontSizeS" fontColor="gray600">
                      {r.fieldName} [{r.locale}]
                      {r.isOnDenyList && (
                        <>
                          {' · '}
                          <Text as="span" fontSize="fontSizeS" fontColor="red600">
                            On deny list
                          </Text>
                        </>
                      )}
                      {r.isBlockedByAllowList && (
                        <>
                          {' · '}
                          <Text as="span" fontSize="fontSizeS" fontColor="red600">
                            Not on allow list
                          </Text>
                        </>
                      )}
                      {r.status != null && ` · (${r.status})`}
                      {r.error && ` · ${r.error}`}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}

          <Checkbox
            isChecked={showAll}
            onChange={(e) => setShowAll((e.target as HTMLInputElement).checked)}
          >
            Show all links
          </Checkbox>

          {showAll && (
            <Box>
              <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
                All links
              </Text>
              <Flex flexDirection="column" gap="spacingXs">
                {results.map((r, i) => (
                  <Box key={`all-${r.url}-${r.fieldId}-${r.locale}-${i}`}>
                    <a href={r.resolvedUrl ?? r.url} target="_blank" rel="noopener noreferrer">
                      {r.url}
                    </a>
                    <Text as="p" fontSize="fontSizeS" fontColor="gray600">
                      {r.fieldName} [{r.locale}] ·{' '}
                      {r.isValid ? (
                        <Text fontColor="green600" fontSize="fontSizeS">Valid</Text>
                      ) : (
                        <Text fontColor="red600" fontSize="fontSizeS">Invalid</Text>
                      )}
                      {r.status != null && ` (${r.status})`}
                      {r.isOnDenyList && (
                        <>
                          {' · '}
                          <Text as="span" fontColor="red600" fontSize="fontSizeS">
                            On deny list
                          </Text>
                        </>
                      )}
                      {r.isBlockedByAllowList && (
                        <>
                          {' · '}
                          <Text as="span" fontColor="red600" fontSize="fontSizeS">
                            Not on allow list
                          </Text>
                        </>
                      )}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
      )}

      {!loading && results.length === 0 && !functionUnavailable && noUrlsFound && (
        <Paragraph fontColor="gray600">&quot;No URLs found in this entry&apos;s fields.&quot;</Paragraph>
      )}
    </Flex>
  );
}
