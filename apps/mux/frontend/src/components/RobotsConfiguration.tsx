import { FC, useCallback, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  Note,
  Paragraph,
  Spinner,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { CycleIcon, PlusIcon } from '@contentful/f36-icons';
import ExternalLink from './ExternalLink';
import DirectiveId from './DirectiveId';
import RobotsCapabilityNote from './Robots/RobotsCapabilityNote';
import ApiClient from '../util/apiClient';
import { muxApiErrorFromResponse } from '../util/muxApi';
import { RobotsDirective } from '../util/robotsTypes';
import { ROBOTS_DOCS_URL, capabilityFromError } from '../util/robots';

/**
 * The Robots section of the app configuration screen: which directives run on every new upload.
 *
 * **Why this calls `api.mux.com` directly** rather than going through `muxProxy` like the rest of
 * the app: this screen has to work *before* the app is installed. App action calls are scoped to
 * an app installation, and the first thing a new customer does here is paste credentials and
 * validate them — the same reason signing-key creation is a direct call. `muxProxy` also reads
 * credentials from `context.appInstallationParameters`, i.e. the *saved* ones, so a token pasted
 * but not yet saved would list the wrong account's directives, or none.
 *
 * **What happens if that direct call is blocked.** Mux granted Contentful a browser-CORS
 * exception, and whether it covers `/robots/v0/*` as well as the Video API paths is not settled.
 * So the picker degrades rather than breaking: if the fetch fails, directive ids can be pasted by
 * hand and everything downstream works identically. The list is a convenience, not the mechanism.
 *
 * **A listing is evidence about the credentials it was read with, and no others.** A selected
 * id the account does not have — deleted in Mux, or chosen under a different token — cannot run,
 * and used to sit here unmarked through every save. It is shown as missing, with a way to remove
 * it, but only once a *complete* listing for the token in the form says so. See ADR-0009.
 */

interface RobotsConfigurationProps {
  tokenId?: string;
  tokenSecret?: string;
  /** The token the saved configuration was loaded with, to tell when it has been replaced. */
  savedTokenId?: string;
  savedTokenSecret?: string;
  directiveIds: string[];
  onChange: (directiveIds: string[]) => void;
}

/** `GET /robots/v0/directives` is paginated, so an account with many would silently truncate. */
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/** One press of "List directives", kept with the credentials it was made with. */
interface DirectiveListing {
  tokenId: string;
  tokenSecret: string;
  directives: RobotsDirective[];
  /** Every page read. Only then does an id's absence mean the account does not have it. */
  isComplete: boolean;
  loadError?: string;
  unavailable?: ReturnType<typeof capabilityFromError>;
}

const RobotsConfiguration: FC<RobotsConfigurationProps> = ({
  tokenId,
  tokenSecret,
  savedTokenId,
  savedTokenSecret,
  directiveIds,
  onChange,
}) => {
  const [listing, setListing] = useState<DirectiveListing | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  const hasCredentials = !!tokenId && !!tokenSecret;

  const loadDirectives = useCallback(async () => {
    if (!tokenId || !tokenSecret) return;
    setIsLoading(true);

    const apiClient = new ApiClient(tokenId, tokenSecret);
    const next: DirectiveListing = { tokenId, tokenSecret, directives: [], isComplete: false };

    try {
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const response = await apiClient.get(
          `/robots/v0/directives?limit=${PAGE_SIZE}&page=${page}`
        );

        if (!response.ok) {
          // The Robots tab's own classifier, not a second one keyed on the status alone: that
          // read every 403 as a missing scope, and told an account that had only not accepted
          // the terms to throw away a working token.
          const capability = capabilityFromError(await muxApiErrorFromResponse(response));
          if (capability) next.unavailable = capability;
          else next.loadError = `Mux returned ${response.status} when listing directives.`;
          break;
        }

        const body = await response.json();
        const items: RobotsDirective[] = body?.data ?? [];
        next.directives.push(...items);
        if (items.length < PAGE_SIZE) {
          next.isComplete = true;
          break;
        }
      }
    } catch (error) {
      // A CORS rejection surfaces as a TypeError with no useful detail, which is exactly the case
      // the manual entry below exists for.
      next.loadError =
        'Could not reach the Mux Robots API from the browser. Paste directive IDs below instead.';
      console.error('[robots] Directive listing failed', error);
    } finally {
      setListing(next);
      setIsLoading(false);
    }
  }, [tokenId, tokenSecret]);

  // Deliberately no fetch on mount.
  //
  // This section is on a screen every existing customer opens, and most of them do not have
  // Robots. Listing directives automatically would fire a cross-origin request to
  // `api.mux.com/robots/v0/directives` for all of them and, on a 403, put an error notice on a
  // configuration screen they came to for something else. Nothing happens until someone asks.

  /** The listing, only while it is about the token in the form. */
  const current =
    listing && listing.tokenId === tokenId && listing.tokenSecret === tokenSecret
      ? listing
      : undefined;
  const directives = current?.directives ?? [];

  const toggle = (directiveId: string, isChecked: boolean) => {
    onChange(
      isChecked
        ? Array.from(new Set([...directiveIds, directiveId]))
        : directiveIds.filter((id) => id !== directiveId)
    );
  };

  const addManualId = () => {
    const trimmed = manualId.trim();
    if (!trimmed) return;
    onChange(Array.from(new Set([...directiveIds, trimmed])));
    setManualId('');
  };

  const knownIds = new Set(directives.map((directive) => directive.id));
  const unlistedIds = directiveIds.filter((id) => !knownIds.has(id));
  const missingIds = current?.isComplete ? unlistedIds : [];
  const uncheckedIds = current?.isComplete ? [] : unlistedIds;

  // Flagged, not cleared: a new token for the same Mux environment keeps every directive valid,
  // and clearing would drop the automation of an admin who was only rotating it.
  const isTokenReplaced =
    !!savedTokenId && (tokenId !== savedTokenId || tokenSecret !== savedTokenSecret);

  return (
    <>
      <Paragraph>
        A directive runs several Robots workflows in order. Pick the ones that should run
        automatically on every video uploaded through this app — anyone who can run Robots can still
        deselect them per upload, and run any directive ad hoc from the Robots tab.{' '}
        <ExternalLink href={`${ROBOTS_DOCS_URL}-directives`}>Author directives in Mux</ExternalLink>
      </Paragraph>

      {directiveIds.length > 0 ? (
        <Note variant="warning" title="This spends money on every upload">
          The {directiveIds.length === 1 ? 'directive' : 'directives'} selected below run on every
          video uploaded through this app and consume Mux AI units, with no per-video confirm step.
          Only people who can run Robots can deselect them per upload.
        </Note>
      ) : (
        <Note variant="neutral">
          Nothing runs automatically. Selecting a directive here means it runs on every new upload
          and consumes Mux AI units — leave this empty unless you want that.
        </Note>
      )}

      {!hasCredentials && (
        <Box marginTop="spacingM">
          <Note variant="neutral">
            Enter your Mux access token above to list this account&apos;s directives.
          </Note>
        </Box>
      )}

      {hasCredentials && (
        <Box marginTop="spacingM">
          {isTokenReplaced && directiveIds.length > 0 && !current?.isComplete && (
            <Box marginBottom="spacingM">
              <Note variant="warning" title="The Mux token has changed">
                The directives selected here were chosen with the previous token and may not exist
                in this account. List the directives to check them.
              </Note>
            </Box>
          )}

          <Flex alignItems="center" gap="spacingS" marginBottom="spacingS">
            <Button
              size="small"
              variant="secondary"
              startIcon={<CycleIcon />}
              isDisabled={isLoading}
              onClick={loadDirectives}>
              {directives.length > 0 ? 'Reload directives' : 'List directives'}
            </Button>
            {isLoading && <Spinner size="small" />}
          </Flex>

          {current?.loadError && (
            <Box marginBottom="spacingM">
              <Note variant="warning">{current.loadError}</Note>
            </Box>
          )}

          {current?.unavailable && (
            <RobotsCapabilityNote
              state={current.unavailable.state}
              termsUrl={current.unavailable.termsUrl}
            />
          )}

          {directives.map((directive) => (
            <Box key={directive.id} marginBottom="spacingXs">
              <Checkbox
                id={`mux-robots-directive-${directive.id}`}
                name={`mux-robots-directive-${directive.id}`}
                isChecked={directiveIds.includes(directive.id)}
                onChange={(event) =>
                  toggle(directive.id, (event.target as HTMLInputElement).checked)
                }>
                {directive.name || <DirectiveId id={directive.id} />}
              </Checkbox>
              {/* In place of the Checkbox's own `helpText`, which is a string and so cannot be told
                  to wrap an id that has no spaces in it. The same text tokens and indent. */}
              {directive.name && (
                <Text as="p" fontColor="gray500" marginLeft="spacingL" isWordBreak>
                  {directive.id}
                </Text>
              )}
            </Box>
          ))}

          {current?.isComplete && directives.length === 0 && (
            <Note variant="neutral">
              This Mux account has no directives yet. Create one in Mux, then reload.
            </Note>
          )}

          {missingIds.length > 0 && (
            <Box marginTop="spacingM">
              <Note
                variant="negative"
                title="Selected, but not in this Mux account"
                data-testid="robots-directives-missing">
                These were deleted in Mux, or chosen with a different token, so they cannot run.
                Remove them and save.
                {missingIds.map((id) => (
                  <Flex key={id} alignItems="center" gap="spacingS" marginTop="spacingS">
                    <DirectiveId id={id} />
                    <Button
                      size="small"
                      variant="secondary"
                      aria-label={`Remove ${id}`}
                      onClick={() => toggle(id, false)}>
                      Remove
                    </Button>
                  </Flex>
                ))}
              </Note>
            </Box>
          )}

          {uncheckedIds.length > 0 && (
            <Box marginTop="spacingM">
              <Text fontWeight="fontWeightDemiBold">Selected by ID</Text>
              {!current && (
                <FormControl.HelpText marginTop="none">
                  Not checked against this Mux account yet — list the directives to check.
                </FormControl.HelpText>
              )}
              {uncheckedIds.map((id) => (
                <Checkbox
                  key={id}
                  id={`mux-robots-directive-manual-${id}`}
                  name={`mux-robots-directive-manual-${id}`}
                  isChecked
                  onChange={() => toggle(id, false)}>
                  <DirectiveId id={id} />
                </Checkbox>
              ))}
            </Box>
          )}

          <FormControl id="mux-robots-directive-id" marginTop="spacingM">
            <FormControl.Label>Add a directive by ID</FormControl.Label>
            <Flex gap="spacingS">
              <TextInput
                name="mux-robots-directive-id"
                value={manualId}
                placeholder="drv_..."
                onChange={(event) => setManualId((event.target as HTMLInputElement).value)}
              />
              <Button
                variant="secondary"
                startIcon={<PlusIcon />}
                isDisabled={!manualId.trim()}
                onClick={addManualId}>
                Add
              </Button>
            </Flex>
            <FormControl.HelpText>
              Use this if the list above cannot load. IDs are shown on the directive in your Mux
              dashboard.
            </FormControl.HelpText>
          </FormControl>
        </Box>
      )}
    </>
  );
};

export default RobotsConfiguration;
