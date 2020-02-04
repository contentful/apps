import React from 'react';
import { TextInput, Card, Tooltip } from '@contentful/forma-36-react-components';
import JiraClient from '../../jiraClient';

interface Props {
  client: JiraClient;
  entry: ContentfulEntry;
  linkIssue: (issue: FormattedIssue) => void;
  issuesAdded: string[];
}

interface State {
  value: string;
  issues: FormattedIssue[];
}

export default class Search extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      value: '',
      issues: []
    };
  }

  async componentDidUpdate(_prevProps: Props, prevState: State) {
    const { value } = this.state;

    if (value.length > 4 && value !== prevState.value) {
      const res = await this.props.client.searchIssues(value);
      if (res.issues.length) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ issues: res.issues });
      }
    }
  }

  updateValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = e.target.value;

    if (!updatedValue) {
      this.clearSearch();
    } else {
      this.setState({ value: updatedValue });
    }
  };

  clearSearch = () => {
    this.setState({
      value: '',
      issues: []
    });
  };

  addLink = (issue: FormattedIssue) => {
    this.clearSearch();
    this.props.linkIssue(issue);
  };

  render() {
    let issuesToShow = this.state.issues;

    // only show top 4 issues that aren't already linked
    if (issuesToShow.length && this.props.issuesAdded) {
      issuesToShow = issuesToShow
        .filter(i => {
          return !this.props.issuesAdded.includes(i.key);
        })
        .slice(0, 4);
    }

    return (
      <div className="search">
        <TextInput
          value={this.state.value}
          onChange={this.updateValue}
          placeholder="Search for Jira issues to link"
          testId="jira-issue-search"
        />
        {issuesToShow.length > 0 &&
          issuesToShow.map(issue => (
            <Card
              key={issue.key}
              padding="none"
              className="search-card"
              testId="search-result-issue"
              onClick={() => this.addLink(issue)}>
              <div>
                <Tooltip place="bottom" content={`${issue.issuetype.name}: ${issue.key}`}>
                  <img className="type" src={issue.issuetype.iconUrl} alt={issue.issuetype.name} />
                </Tooltip>
              </div>
              <div>{issue.summary}</div>
            </Card>
          ))}
      </div>
    );
  }
}
