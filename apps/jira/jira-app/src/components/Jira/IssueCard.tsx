import React from 'react';
import { FormattedIssue } from '../../interfaces';

import { Card, Tooltip, Badge, Menu, TextLink, IconButton } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';

type TagType = 'primary' | 'positive' | 'warning' | 'secondary' | 'negative';

const statusColors: { [key: string]: TagType } = {
  'medium-gray': 'primary',
  green: 'positive',
  yellow: 'warning',
  brown: 'secondary',
  'warm-red': 'negative',
};

interface Props {
  issue: FormattedIssue;
  onRemoveClick: () => void;
}

const IssueCard = ({ issue, onRemoveClick }: Props) => {
  const openInJira = () => window.open(issue.link, undefined, 'noopener,noreferrer');

  return (
    <Card id="jira-ticket">
      <div className="primary">
        <div className="top">
          <Badge variant={statusColors[issue.status.statusCategory.colorName]} className="tag">
            {issue.status.name}
          </Badge>
          <Menu>
            <Menu.Trigger>
              <IconButton
                testId="menu-button"
                variant="transparent"
                icon={<MoreHorizontalIcon />}
                aria-label="toggle menu"
              />
            </Menu.Trigger>
            <Menu.List>
              <Menu.Item onClick={openInJira}>Open in Jira</Menu.Item>
              <Menu.Item onClick={onRemoveClick}>Unlink</Menu.Item>
            </Menu.List>
          </Menu>
        </div>
        <div data-test-id="issue-summary">
          <TextLink onClick={openInJira} className="summary">
            {issue.summary}
          </TextLink>
        </div>
      </div>
      <div className="meta">
        <div className="status">
          <Tooltip placement="right" content={issue.issuetype.name}>
            <img className="type" src={issue.issuetype.iconUrl} alt={issue.issuetype.name} />
          </Tooltip>
          {issue.priority && (
            <Tooltip placement="right" content={`${issue.priority.name} priority`}>
              <img src={issue.priority.iconUrl} alt={issue.priority.name} height={22} />
            </Tooltip>
          )}
        </div>
        <div className="details">
          <TextLink onClick={openInJira}>
            <span className="key">{issue.key}</span>
          </TextLink>
          {issue.assignee ? (
            <Tooltip placement="left" content={`Assignee: ${issue.assignee.displayName}`}>
              <img
                className="avatar"
                src={issue.assignee.avatarUrls['24x24']}
                alt={issue.assignee.displayName}
                height={22}
                data-test-id="issue-assignee"
              />
            </Tooltip>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default IssueCard;
