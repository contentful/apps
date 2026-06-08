import React from 'react';
import { Badge, Box, Button, Flex, Stack, Text } from '@contentful/f36-components';
import type { BadgeProps } from '@contentful/f36-components';
import type { AuditFinding, Severity } from '../audit/types';
import SuggestedFix from './SuggestedFix';
import EmptyState from './EmptyState';

interface FindingListProps {
  findings: AuditFinding[];
  canLocate: boolean;
  canFix: boolean;
  onLocate: (finding: AuditFinding) => void;
  onApplyDeterministic: (finding: AuditFinding) => void;
  onApplySuggested: (finding: AuditFinding, value: string) => void;
  busyFindingId: string | null;
}

const SEVERITY_VARIANT: Record<Severity, BadgeProps['variant']> = {
  error: 'negative',
  warning: 'warning',
  info: 'secondary',
};

const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'info'];
const SEVERITY_LABEL: Record<Severity, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
};

const FindingList = ({
  findings,
  canLocate,
  canFix,
  onLocate,
  onApplyDeterministic,
  onApplySuggested,
  busyFindingId,
}: FindingListProps) => {
  if (findings.length === 0) return <EmptyState />;

  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingM" fullWidth>
      {SEVERITY_ORDER.map((severity) => {
        const group = findings.filter((f) => f.severity === severity);
        if (group.length === 0) return null;
        return (
          <Stack
            key={severity}
            flexDirection="column"
            alignItems="stretch"
            spacing="spacingXs"
            fullWidth>
            <Text fontColor="gray600" fontSize="fontSizeS" fontWeight="fontWeightDemiBold">
              {SEVERITY_LABEL[severity]} · {group.length}
            </Text>
            {group.map((finding) => (
              <Box
                key={finding.id}
                padding="spacingS"
                style={{ border: '1px solid var(--color-element-mid)', borderRadius: '6px' }}
                data-test-id="finding">
                <Flex justifyContent="space-between" alignItems="flex-start" gap="spacingS">
                  <Flex flexDirection="column" gap="spacing2Xs" style={{ flex: 1 }}>
                    <Flex alignItems="center" gap="spacingXs">
                      <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
                      <Text fontWeight="fontWeightDemiBold">{finding.title}</Text>
                    </Flex>
                    <Text fontColor="gray600" fontSize="fontSizeS">
                      {finding.detail}
                    </Text>
                    {finding.fix?.kind === 'suggested' && (
                      <SuggestedFix
                        suggestedValue={finding.fix.suggestedValue}
                        source={finding.fix.source}
                        canApply={canFix}
                        isApplying={busyFindingId === finding.id}
                        onApply={(value) => onApplySuggested(finding, value)}
                      />
                    )}
                  </Flex>
                  <Flex gap="spacingXs" flexShrink={0}>
                    <Button
                      size="small"
                      variant="secondary"
                      isDisabled={!canLocate}
                      onClick={() => onLocate(finding)}
                      title={
                        canLocate
                          ? undefined
                          : 'Locate on canvas is not available — the experience editor does not expose selection yet'
                      }>
                      Locate
                    </Button>
                    {finding.fix?.kind === 'deterministic' && (
                      <Button
                        size="small"
                        variant="primary"
                        isDisabled={!canFix}
                        isLoading={busyFindingId === finding.id}
                        onClick={() => onApplyDeterministic(finding)}
                        title={
                          canFix ? undefined : 'You do not have permission to edit this experience'
                        }>
                        {finding.fix.label}
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
};

export default FindingList;
