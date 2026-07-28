import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ExperienceContext, ExperienceCanvasToolbarAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

import { collectNodes } from '../audit/collect';
import { hasBlockingErrors, runAudit } from '../audit/engine';
import { detectCapabilities } from '../audit/capabilities';
import type { AuditFinding, AuditReport, Capabilities } from '../audit/types';
import ScoreSummary from '../components/ScoreSummary';
import FindingList from '../components/FindingList';

/**
 * Experience Auditor — a selection-aware Experience toolbar app.
 *
 * On mount (and whenever the experience changes) it walks the experience tree
 * with `sdk.experiences.experience`, runs a set of pure audit rules, and renders a
 * scored list of findings. Each finding can be located on the canvas
 * (`selection.set` + `selection.highlight`). Where a finding has a derivable
 * fix, the suggested value is surfaced as read-only advice — the app-sdk
 * surface exposes no host call to write a node's content properties, so fixes
 * are advisory rather than one-click. Publishing is gated on there being no
 * outstanding errors.
 */
const ExperienceToolbar = () => {
  const sdk = useSDK<ExperienceCanvasToolbarAppSDK>();

  const [context, setContext] = useState<ExperienceContext>(() => sdk.experiences.context);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [auditing, setAuditing] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>(() =>
    detectCapabilities(sdk.experiences)
  );
  useEffect(() => setCapabilities(detectCapabilities(sdk.experiences)), [sdk]);

  // Guard against state updates after unmount / stale async audits.
  const runIdRef = useRef(0);

  const audit = useCallback(async () => {
    const runId = ++runIdRef.current;
    setAuditing(true);
    try {
      const nodes = await collectNodes(sdk.experiences.experience);
      const next = runAudit(nodes);
      if (runId === runIdRef.current) {
        setReport(next);
      }
    } finally {
      if (runId === runIdRef.current) {
        setAuditing(false);
      }
    }
  }, [sdk]);

  // Report the panel's height so the host sizes the toolbar app to its content
  // in the stacked Apps panel. sdk.window on the toolbar location arrived in
  // app-sdk 4.67.0; guard it so hosts that don't serve it degrade to a no-op.
  useEffect(() => {
    if (!sdk.window) {
      return;
    }
    sdk.window.startAutoResizer();
    return () => sdk.window.stopAutoResizer();
  }, [sdk]);

  // Keep context in sync.
  useEffect(() => sdk.experiences.onContextChanged(setContext), [sdk]);

  // Initial audit + re-audit whenever the experience changes.
  // Simplification for the example: every onChange triggers a full traversal.
  // A production app editing rapidly would debounce this (e.g. trailing 300ms)
  // so a burst of edits collapses into a single re-audit instead of N+1 passes.
  useEffect(() => {
    void audit();
    return sdk.experiences.experience.onChange(() => {
      void audit();
    });
  }, [sdk, audit]);

  const handleLocate = useCallback(
    (finding: AuditFinding) => {
      sdk.experiences.experience.selection.set(finding.nodeId);
      sdk.experiences.experience.selection.highlight(finding.nodeId, {
        flash: true,
        scrollIntoView: true,
      });
    },
    [sdk]
  );

  const handlePublish = useCallback(async () => {
    if (!report || hasBlockingErrors(report)) return;

    setPublishing(true);
    try {
      const allowed = await sdk.access.can('publish', 'Entry');
      if (!allowed) {
        sdk.notifier.error('You do not have permission to publish this experience.');
        return;
      }
      await sdk.experiences.experience.publish();
      sdk.notifier.success('Experience published.');
    } catch {
      sdk.notifier.error('Publish failed. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [sdk, report]);

  const blocked = report ? hasBlockingErrors(report) : false;
  const canLocate = capabilities.selection;

  return (
    <Box padding="spacingM">
      <Stack flexDirection="column" alignItems="stretch" spacing="spacingM">
        <Flex justifyContent="space-between" alignItems="center" gap="spacingS" flexWrap="wrap">
          <Flex alignItems="center" gap="spacingXs">
            <Heading marginBottom="none">Experience Auditor</Heading>
            <Badge variant={context.type === 'experience' ? 'primary' : 'secondary'}>
              {context.type}
            </Badge>
          </Flex>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void audit()}
            isLoading={auditing}>
            Re-run audit
          </Button>
        </Flex>

        {report && <ScoreSummary report={report} />}

        {auditing && !report && (
          <Flex justifyContent="center" padding="spacingL">
            <Spinner size="large" />
          </Flex>
        )}

        {report && (
          <FindingList
            findings={report.findings}
            nodeCount={report.nodeCount}
            canLocate={canLocate}
            onLocate={handleLocate}
          />
        )}

        <Flex flexDirection="column" gap="spacingXs">
          {blocked && (
            <Text fontColor="red600" fontSize="fontSizeS" data-test-id="publish-blocked">
              Resolve all errors before publishing.
            </Text>
          )}
          <Button
            variant="positive"
            isDisabled={!report || blocked || publishing}
            isLoading={publishing}
            onClick={() => void handlePublish()}>
            Publish experience
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default ExperienceToolbar;
