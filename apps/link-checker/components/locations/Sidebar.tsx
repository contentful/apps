import React, { useCallback, useState } from 'react';
import {
  Badge,
  Paragraph,
  Button,
  Flex,
  Box,
  Text,
  Checkbox,
  Subheading,
  TextLink,
  Note,
} from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { normalizeDomainPattern, urlMatchesAnyDomainPattern } from '@/utils/domainPatterns';
import { extractUrlsFromEntry, isRelativeUrl, type ExtractedUrl } from '@/utils/extractUrls';
import { type AppInstallationParameters } from './ConfigScreen';

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

function ResultBadges({ result }: { result: LinkCheckResult }) {
  return (
    <Flex gap="spacing2Xs" flexWrap="wrap" marginTop="spacing2Xs">
      {!result.isValid && <Badge variant="negative">Invalid</Badge>}
      {result.isValid && <Badge variant="positive">Valid</Badge>}
      {result.isBlockedByAllowList && <Badge variant="negative">Not on allow list</Badge>}
      {result.isOnDenyList && <Badge variant="negative">On deny list</Badge>}
      {result.status != null && (
        <Badge variant={result.isValid ? 'positive' : 'negative'}>{result.status}</Badge>
      )}
      {result.error && <Badge variant="negative">{result.error}</Badge>}
    </Flex>
  );
}

function ResultCard({ result }: { result: LinkCheckResult }) {
  return (
    <Box
      padding="spacingS"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid var(--color-gray-300)',
        borderRadius: '6px',
        backgroundColor: 'var(--color-white)',
      }}>
      <Flex flexDirection="column" alignItems="stretch" style={{ textAlign: 'left' }}>
        <Box>
          <TextLink
            href={result.resolvedUrl ?? result.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {result.url}
          </TextLink>
        </Box>
        <Text as="p" fontSize="fontSizeS" fontColor="gray600" marginTop="spacing2Xs">
          {result.fieldName} [{result.locale}]
        </Text>
        <ResultBadges result={result} />
      </Flex>
    </Box>
  );
}

export default function Sidebar() {
  const sdk = useSDK<SidebarAppSDK>();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<LinkCheckResult[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [noUrlsFound, setNoUrlsFound] = useState(false);
  const [functionUnavailable, setFunctionUnavailable] = useState(false);
  const [relativeLinksSkipped, setRelativeLinksSkipped] = useState(0);

  const installation = (sdk.parameters.installation || {}) as AppInstallationParameters;
  const explicitAllowedPatterns = (installation.allowedUrlPatterns || '')
    .split(',')
    .map((p) => normalizeDomainPattern(p))
    .filter(Boolean);
  const forbiddenPatterns = (installation.forbiddenUrlPatterns || '')
    .split(',')
    .map((p) => normalizeDomainPattern(p))
    .filter(Boolean);
  const baseUrl = (installation.baseUrl || '').trim().replace(/\/$/, '') || null;
  const allowedPatterns = explicitAllowedPatterns;

  useAutoResizer();

  const runCheck = useCallback(async () => {
    setRunError(null);

    try {
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
            const absolute = new URL(
              item.url,
              baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
            ).href;
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
            const checkAction = items?.find((a: unknown) =>
              matchCheckLinkAction(a as Parameters<typeof matchCheckLinkAction>[0])
            );
            if (checkAction?.sys?.id) resolvedActionId = checkAction.sys.id;
          }
          if (!resolvedActionId && sdk.cma.appAction.getManyForEnvironment) {
            const { items } = await sdk.cma.appAction.getManyForEnvironment({
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
            });
            const checkAction = items?.find((a: unknown) =>
              matchCheckLinkAction(a as Parameters<typeof matchCheckLinkAction>[0])
            );
            if (checkAction?.sys?.id) resolvedActionId = checkAction.sys.id;
          }
        } catch {
          // App Action lookup failed; resolvedActionId remains null
        }
      }

      // Fall back to the manifest action id when the SDK lookup does not return an item.
      resolvedActionId ||= CHECK_LINK_FUNCTION_ID;

      if (!resolvedActionId || !sdk.cma?.appActionCall?.createWithResponse) {
        setLoading(false);
        setProgress(null);
        setFunctionUnavailable(true);
        return;
      }
      setFunctionUnavailable(false);

      const processOne = async (
        item: ExtractedUrl & { urlToCheck: string }
      ): Promise<LinkCheckResult> => {
        const isAllowed =
          allowedPatterns.length === 0 ||
          urlMatchesAnyDomainPattern(item.urlToCheck, allowedPatterns);
        const onDenyList = urlMatchesAnyDomainPattern(item.urlToCheck, forbiddenPatterns);
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
    } catch (error) {
      console.error('Link check failed unexpectedly:', error);
      setLoading(false);
      setProgress(null);
      setResults([]);
      setNoUrlsFound(false);
      setRunError('Link Checker ran into an unexpected problem while scanning this entry.');
    }
  }, [sdk, allowedPatterns, forbiddenPatterns, baseUrl]);

  const invalidResults = results.filter((r) => !r.isValid);
  const remainingResults = results.filter((r) => r.isValid);
  const hasInvalid = invalidResults.length > 0;

  return (
    <Flex flexDirection="column" gap="spacingS" as="section" aria-label="Link checker">
      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={runCheck}
        isLoading={loading}
        isDisabled={loading || functionUnavailable}
        aria-label={
          functionUnavailable
            ? 'Link checking is unavailable; App Action is not configured'
            : undefined
        }>
        Check links
      </Button>

      {functionUnavailable && !loading && (
        <Note variant="warning" title="Link checking unavailable">
          The sidebar could not find the configured App Action for <code>checkLink</code>.
        </Note>
      )}

      {runError && !loading && (
        <Note variant="negative" title="Link checking failed">
          {runError}
        </Note>
      )}

      {!loading && relativeLinksSkipped > 0 && (
        <Note variant="neutral">
          {relativeLinksSkipped} relative link{relativeLinksSkipped !== 1 ? 's' : ''} skipped. Set{' '}
          <strong>Current domain (base URL)</strong> in app config to check them.
        </Note>
      )}
      {loading && progress && (
        <Text as="p" fontColor="gray600">
          Checking link: {progress.done} / {progress.total}
        </Text>
      )}

      {!loading && results.length > 0 && (
        <Box aria-live="polite" aria-atomic="true">
          <Flex alignItems="center" justifyContent="space-between" marginBottom="spacingS">
            {hasInvalid ? (
              <>
                <Subheading marginBottom="none">Invalid links</Subheading>
                <Badge variant="negative">
                  {invalidResults.length} invalid link{invalidResults.length !== 1 ? 's' : ''}
                </Badge>
              </>
            ) : (
              <>
                <Subheading marginBottom="none">All checked links passed</Subheading>
                <Badge variant="positive">All valid</Badge>
              </>
            )}
          </Flex>

          {hasInvalid && (
            <Box>
              <Flex flexDirection="column" gap="spacing2Xs">
                {invalidResults.map((r, i) => (
                  <Box key={`${r.url}-${r.fieldId}-${r.locale}-${i}`} style={{ width: '100%' }}>
                    <ResultCard result={r} />
                  </Box>
                ))}
              </Flex>
            </Box>
          )}

          {remainingResults.length > 0 && (
            <Box marginTop="spacingS">
              <Flex alignItems="center" justifyContent="space-between" marginBottom="spacing2Xs">
                <Text as="p" fontWeight="fontWeightMedium">
                  Valid links
                </Text>
                <Badge variant="positive">
                  {remainingResults.length} valid link{remainingResults.length !== 1 ? 's' : ''}
                </Badge>
              </Flex>
              <Checkbox
                isChecked={showAll}
                onChange={(e) => setShowAll((e.target as HTMLInputElement).checked)}>
                Show valid links
              </Checkbox>
            </Box>
          )}

          {showAll && remainingResults.length > 0 && (
            <Box marginTop="spacingS">
              <Flex flexDirection="column" gap="spacing2Xs">
                {remainingResults.map((r, i) => (
                  <Box key={`all-${r.url}-${r.fieldId}-${r.locale}-${i}`} style={{ width: '100%' }}>
                    <ResultCard result={r} />
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
      )}

      {!loading && results.length === 0 && !functionUnavailable && noUrlsFound && (
        <Note variant="neutral">No URLs found in this entry&apos;s fields.</Note>
      )}
    </Flex>
  );
}
