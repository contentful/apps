import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ExoContext,
  ExperienceEditorToolbarAppSDK,
  UiMode,
} from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Spinner,
  Stack,
  Text,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

import { collectNodes } from '../audit/collect';
import { hasBlockingErrors, runAudit } from '../audit/engine';
import type { AuditFinding, AuditReport } from '../audit/types';
import ScoreSummary from '../components/ScoreSummary';
import FindingList from '../components/FindingList';

/**
 * Experience Auditor — a selection-aware ExO toolbar app.
 *
 * On mount (and whenever the experience changes) it walks the experience tree
 * with `sdk.exo.experience`, runs a set of pure audit rules, and renders a
 * scored list of findings. Each finding can be located on the canvas
 * (`selection.set` + `selection.highlight`) and, where a safe deterministic fix
 * exists, repaired in place (`getNode().setContentProperty`). Publishing is
 * gated on there being no outstanding errors.
 */
const ExperienceToolbar = () => {
  const sdk = useSDK<ExperienceEditorToolbarAppSDK>();

  const [context, setContext] = useState<ExoContext>(() => sdk.exo.context);
  const [uiMode, setUiMode] = useState<UiMode>(() => sdk.exo.getUiMode());
  const [report, setReport] = useState<AuditReport | null>(null);
  const [auditing, setAuditing] = useState(true);
  const [canFix, setCanFix] = useState(false);
  const [busyFindingId, setBusyFindingId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Guard against state updates after unmount / stale async audits.
  const runIdRef = useRef(0);

  const audit = useCallback(async () => {
    const runId = ++runIdRef.current;
    setAuditing(true);
    try {
      const nodes = await collectNodes(sdk.exo.experience);
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

  // Keep context and ui mode in sync.
  useEffect(() => sdk.exo.onContextChanged(setContext), [sdk]);
  useEffect(() => sdk.exo.onUiModeChanged(setUiMode), [sdk]);

  // Resolve write permission once for UX gating (the host still enforces).
  useEffect(() => {
    let active = true;
    sdk.access
      .can('update', 'Entry')
      .then((allowed) => {
        if (active) setCanFix(allowed);
      })
      .catch(() => {
        if (active) setCanFix(false);
      });
    return () => {
      active = false;
    };
  }, [sdk]);

  // Initial audit + re-audit whenever the experience changes.
  // Simplification for the example: every onChange triggers a full traversal.
  // A production app editing rapidly would debounce this (e.g. trailing 300ms)
  // so a burst of edits collapses into a single re-audit instead of N+1 passes.
  useEffect(() => {
    void audit();
    return sdk.exo.experience.onChange(() => {
      void audit();
    });
  }, [sdk, audit]);

  const handleLocate = useCallback(
    (finding: AuditFinding) => {
      sdk.exo.experience.selection.set(finding.nodeId);
      // Highlight is a no-op in form mode; the button is disabled there anyway.
      sdk.exo.experience.selection.highlight(finding.nodeId, {
        flash: true,
        scrollIntoView: true,
      });
    },
    [sdk]
  );

  const handleFix = useCallback(
    async (finding: AuditFinding) => {
      // This handler applies deterministic fixes (write the precomputed value).
      // Suggested fixes are applied through a separate confirm path (added later).
      if (finding.fix?.kind !== 'deterministic') return;

      setBusyFindingId(finding.id);
      try {
        const node = sdk.exo.experience.getNode(finding.nodeId);
        if (!node) {
          sdk.notifier.error('That component no longer exists.');
          return;
        }
        await node.setContentProperty(finding.fix.propertyKey, finding.fix.value);
        sdk.notifier.success('Fix applied.');
        // Re-audit explicitly rather than relying on the setContentProperty
        // write to round-trip back through onChange — that keeps the panel in
        // sync even if the host doesn't emit a change event for this write.
        await audit();
      } catch {
        sdk.notifier.error('Could not apply the fix. Please try again.');
      } finally {
        setBusyFindingId(null);
      }
    },
    [sdk, audit]
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
      await sdk.exo.experience.publish();
      sdk.notifier.success('Experience published.');
    } catch {
      sdk.notifier.error('Publish failed. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [sdk, report]);

  const blocked = report ? hasBlockingErrors(report) : false;
  const canLocate = uiMode === 'visual';

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
            isLoading={auditing}
          >
            Re-run audit
          </Button>
        </Flex>

        {uiMode === 'form' && (
          <Note variant="neutral">
            You are in <strong>form</strong> mode. Findings still update live, but locating a
            component on the canvas requires <strong>visual</strong> mode.
          </Note>
        )}

        {report && <ScoreSummary report={report} />}

        {auditing && !report && (
          <Flex justifyContent="center" padding="spacingL">
            <Spinner size="large" />
          </Flex>
        )}

        {report && (
          <FindingList
            findings={report.findings}
            canLocate={canLocate}
            canFix={canFix}
            onLocate={handleLocate}
            onFix={handleFix}
            busyFindingId={busyFindingId}
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
            onClick={() => void handlePublish()}
          >
            Publish experience
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default ExperienceToolbar;
