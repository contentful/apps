import React from 'react';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Paragraph,
  Typography
} from '@contentful/forma-36-react-components';
import IssueCard from './IssueCard';
import ErrorMessage from './ErrorMessage';

interface Props {
  issues: FormattedIssue[];
  loading: boolean;
  unlinkIssue: (issueId: string) => void;
  error: IssuesResponse['error'];
}

export default class IssueList extends React.Component<Props> {
  render() {
    const { issues, loading, unlinkIssue, error } = this.props;

    if (error) {
      return (
        <ErrorMessage errorType={error} />
      );
    }

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
          <Paragraph className="paragraph-light">
            No Jira issues are linked to this entry.
          </Paragraph>
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
