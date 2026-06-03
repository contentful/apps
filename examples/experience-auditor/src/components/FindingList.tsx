import React from 'react';
import { Badge, Box, Button, Flex, Note, Stack, Text } from '@contentful/f36-components';
import type { BadgeProps } from '@contentful/f36-components';
import type { AuditFinding, Severity } from '../audit/types';

interface FindingListProps {
  findings: AuditFinding[];
  /** Whether the canvas supports highlighting (visual mode only). */
  canLocate: boolean;
  /** Whether the current user may write content properties. */
  canFix: boolean;
  onLocate: (finding: AuditFinding) => void;
  onFix: (finding: AuditFinding) => void;
  busyFindingId: string | null;
}

const SEVERITY_VARIANT: Record<Severity, BadgeProps['variant']> = {
  error: 'negative',
  warning: 'warning',
  info: 'secondary',
};

const FindingList = ({
  findings,
  canLocate,
  canFix,
  onLocate,
  onFix,
  busyFindingId,
}: FindingListProps) => {
  if (findings.length === 0) {
    return (
      <Note variant="positive" data-test-id="all-clear">
        No issues found. This experience passes every audit rule. 🎉
      </Note>
    );
  }

  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingS" fullWidth>
      {findings.map((finding) => (
        <Box
          key={finding.id}
          padding="spacingS"
          style={{
            border: '1px solid var(--color-element-mid)',
            borderRadius: '6px',
          }}
          data-test-id="finding"
        >
          <Flex justifyContent="space-between" alignItems="flex-start" gap="spacingS">
            <Flex flexDirection="column" gap="spacing2Xs">
              <Flex alignItems="center" gap="spacingXs">
                <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
                <Text fontWeight="fontWeightDemiBold">{finding.title}</Text>
              </Flex>
              <Text fontColor="gray600" fontSize="fontSizeS">
                {finding.detail}
              </Text>
              {finding.propertyKey && (
                <Text fontColor="gray500" fontSize="fontSizeS">
                  Property: <code>{finding.propertyKey}</code>
                </Text>
              )}
            </Flex>

            <Flex gap="spacingXs" flexShrink={0}>
              <Button
                size="small"
                variant="secondary"
                isDisabled={!canLocate}
                onClick={() => onLocate(finding)}
                title={canLocate ? undefined : 'Switch to visual mode to locate on the canvas'}
              >
                Locate
              </Button>
              {finding.fix && (
                <Button
                  size="small"
                  variant="primary"
                  isDisabled={!canFix}
                  isLoading={busyFindingId === finding.id}
                  onClick={() => onFix(finding)}
                  title={canFix ? undefined : 'You do not have permission to edit this experience'}
                >
                  {finding.fix.label}
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      ))}
    </Stack>
  );
};

export default FindingList;
