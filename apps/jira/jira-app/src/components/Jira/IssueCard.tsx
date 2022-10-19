import React from 'react';
import { TagType } from '@contentful/forma-36-react-components/dist/components/Tag/Tag';
import { FormattedIssue } from '../../interfaces';

import { CardActions, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';

import { Badge, Card, TextLink, Tooltip } from '@contentful/f36-components';

const statusColors: { [key: string]: TagType } = {
  'medium-gray': 'primary',
  green: 'positive',
  yellow: 'warning',
  brown: 'secondary',
  'warm-red': 'negative',
  'blue-gray': 'muted',
};

interface Props {
  issue: FormattedIssue;
  onRemoveClick: () => void;
}

const IssueCard = ({ issue, onRemoveClick }: Props) => {
  const openInJira = () => window.open(issue.link, undefined, 'noopener,noreferrer');

  return (
    <Card className="jira-ticket">
      <div className="primary">
        <div className="top">
          <Badge variant={statusColors[issue.status.statusCategory.colorName]} className="tag">
            {issue.status.name}
          </Badge>
          <CardActions>
            <DropdownList>
              <DropdownListItem onClick={openInJira}>Open in Jira</DropdownListItem>
              <DropdownListItem onClick={onRemoveClick}>Unlink</DropdownListItem>
            </DropdownList>
          </CardActions>
        </div>
        <div data-test-id="issue-summary">
          <TextLink as="button" onClick={openInJira} className="summary">
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
          <TextLink as="button" onClick={openInJira}>
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
