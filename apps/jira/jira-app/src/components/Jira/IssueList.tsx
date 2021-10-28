import React from 'react';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Paragraph,
  Typography
} from '@contentful/forma-36-react-components';
import IssueCard from './IssueCard';
import { FormattedIssue } from '../../interfaces';

interface Props {
  issues: FormattedIssue[];
  loading: boolean;
  unlinkIssue: (issueId: string) => void;
}

export default class IssueList extends React.Component<Props> {
  render() {
    const { issues, loading, unlinkIssue } = this.props;

    if (loading) {
      return (
        <SkeletonContainer>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      );
    }

    if (!issues.length) {
      return (
        <Typography>
          <Paragraph className="paragraph-light">No Jira issues are linked to this entry</Paragraph>
        </Typography>
      );
    }

    return (
      <>
        {issues.map(issue => (
          <IssueCard issue={issue} key={issue.key} onRemoveClick={() => unlinkIssue(issue.key)} />
        ))}
      </>
    );
  }
}
