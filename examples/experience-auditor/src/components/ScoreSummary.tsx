import React from 'react';
import { Badge, Flex, Text } from '@contentful/f36-components';
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
  const color = scoreColor(score);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <Flex justifyContent="space-between" alignItems="center" fullWidth>
      <Flex alignItems="center" gap="spacingM">
        <div style={{ position: 'relative', width: 64, height: 64 }} data-test-id="health-score">
          <svg viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={tokens.gray200}
              strokeWidth="7"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div
            className={css({
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              fontSize: '1.25rem',
              fontWeight: 700,
            })}>
            {score}
          </div>
        </div>
        <Flex flexDirection="column">
          <Text fontColor="gray500" fontSize="fontSizeS">
            Health score
          </Text>
          <Text fontColor="gray500" fontSize="fontSizeS">
            across {nodeCount} {nodeCount === 1 ? 'component' : 'components'}
          </Text>
        </Flex>
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
