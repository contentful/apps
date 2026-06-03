import React from 'react';
import { Badge, Flex, Heading, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import type { AuditReport } from '../audit/types';

interface ScoreSummaryProps {
  report: AuditReport;
}

function scoreColor(score: number): string {
  if (score >= 90) return tokens.green600;
  if (score >= 70) return tokens.yellow600;
  return tokens.red600;
}

const ScoreSummary = ({ report }: ScoreSummaryProps) => {
  const { score, counts, nodeCount } = report;

  return (
    <Flex justifyContent="space-between" alignItems="center" fullWidth>
      <Flex flexDirection="column">
        <Text fontColor="gray500" fontSize="fontSizeS">
          Health score
        </Text>
        <Heading
          marginBottom="none"
          className={css({ color: scoreColor(score), fontSize: '2.25rem', lineHeight: 1 })}
          data-test-id="health-score"
        >
          {score}
        </Heading>
        <Text fontColor="gray500" fontSize="fontSizeS">
          across {nodeCount} {nodeCount === 1 ? 'component' : 'components'}
        </Text>
      </Flex>

      <Flex gap="spacingXs" flexWrap="wrap" justifyContent="flex-end">
        <Badge variant="negative">{counts.error} errors</Badge>
        <Badge variant="warning">{counts.warning} warnings</Badge>
        <Badge variant="secondary">{counts.info} info</Badge>
      </Flex>
    </Flex>
  );
};

export default ScoreSummary;
