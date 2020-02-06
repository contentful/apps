/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import { SidebarExtensionSDK } from 'contentful-ui-extensions-sdk';
import IssueList from './IssueList';
import Search from './Search';
import JiraClient from '../../jiraClient';

interface Props {
  sdk: SidebarExtensionSDK;
  client: JiraClient;
}

interface State {
  loading: boolean;
  issues: FormattedIssue[];
}
/** The Jira sidebar component */
export default class Jira extends React.Component<Props, State> {
  private issueInterval: NodeJS.Timeout | undefined;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      issues: []
    };
  }

  async componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    await this.getIssues();

    this.issueInterval = setInterval(this.getIssues, 30000);
  }

  componentWillUnmount() {
    this.clearIssueInterval();
  }

  clearIssueInterval() {
    if (this.issueInterval) {
      clearInterval(this.issueInterval)
    }
  }

  sortIssues = (issues: FormattedIssue[]) => {
    const { user } = this.props.sdk;

    const sortMap: {
      [index: string]: FormattedIssue[];
    } = {
      mine: [],
      assigned: [],
      other: []
    };

    // sort list by assigned first then others
    const sortedIssues = issues.reduce((acc, issue) => {
      const hasAssignee = !!issue.assignee;
      const myIssue =
        hasAssignee &&
        (issue.assignee!.displayName.includes(user.firstName) ||
          issue.assignee!.displayName.includes(user.lastName));

      if (myIssue) {
        acc.mine.push(issue);
      } else if (hasAssignee) {
        acc.assigned.push(issue);
      } else {
        acc.other.push(issue);
      }

      return acc;
    }, sortMap);

    return [...sortedIssues.mine, ...sortedIssues.assigned, ...sortedIssues.other];
  };

  getIssues = async () => {
    const res = await this.props.client.getIssuesForEntry(this.props.sdk.ids);

    let issues: FormattedIssue[] = [];

    if (res.issues.length) {
      issues = this.sortIssues(res.issues);
    }

    this.setState({ issues, loading: false });
  };

  unlinkIssue = async (issueId: string) => {
    // optimistically remove from local state
    this.setState((prevState: State) => ({
      issues: prevState.issues.filter(issue => issue.key !== issueId)
    }));

    const success = await this.props.client.removeContentfulLink(this.props.sdk.ids, issueId);

    await this.getIssues();

    if (!success) {
      this.props.sdk.notifier.error(`There was a problem unlinking ${issueId}. Please try again.`);
    }
  };

  linkIssue = async (issue: FormattedIssue) => {
    // optimistically add the issue
    this.setState((prevState: State) => ({
      issues: this.sortIssues([issue, ...prevState.issues])
    }));

    const success = await this.props.client.addContentfulLink(this.props.sdk.ids, issue.key);

    if (!success) {
      this.props.sdk.notifier.error(
        `There was a problem adding issue ${issue.key}. Please try again.`
      );

      // Remove the optimistically added issue :(
      this.setState((prevState: State) => ({
        issues: prevState.issues.filter(i => i.key !== issue.key)
      }));
    }
  };

  render() {
    return (
      <div>
        <IssueList
          unlinkIssue={this.unlinkIssue}
          issues={this.state.issues}
          loading={this.state.loading}
        />
        <Search
          entry={this.props.sdk.ids}
          client={this.props.client}
          linkIssue={this.linkIssue}
          issuesAdded={this.state.issues.map(i => i.key)}
        />
      </div>
    );
  }
}
