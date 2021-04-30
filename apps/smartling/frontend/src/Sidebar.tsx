import React from 'react';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import {
  Icon,
  Button,
  Paragraph,
  Tag,
  Card,
  Tooltip,
  TextLink,
  SkeletonContainer,
  SkeletonImage,
  Spinner,
  Note
} from '@contentful/forma-36-react-components';
import smartlingClient from './smartlingClient';

interface Props {
  sdk: SidebarExtensionSDK;
  projectId: string;
}

interface State {
  smartlingEntry: SmartlingContentfulEntry | null;
  token: string;
  refreshToken: string;
  showAllSubs: boolean;
  generalError: boolean;
}

const SUBS_TO_SHOW = 3;

function makeSmartlingLink(projectId: string, entryId: string, spaceId: string) {
  return (
    `https://dashboard.smartling.com/app/projects/${projectId}/` +
    `connectors/contentful/content.html?asset=ENTRY&assetId=${spaceId}-${entryId}&page=1&spaceId=${spaceId}`
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'not translated':
      return 'secondary';
    case 'in progress':
    case 'in_progress':
      return 'primary';
    case 'completed':
      return 'positive';
    case 'cancelled':
    case 'canceled':
    case 'failed':
      return 'negative';
    case 'new':
      return 'warning';
    default:
      return;
  }
}

function showSubmittedByStatus(status: string) {
  const s = status.toLowerCase();
  return s === 'in_progress' || s === 'new';
}

function formatSubmissionStatus(status: string) {
  switch (status.toLowerCase()) {
    case 'new':
      return 'Awaiting Authorization';
    case 'in_progress':
      return 'In Progress';
    case 'canceled':
    case 'cancelled':
      return 'Canceled';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return '';
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(window.navigator.language || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}

function sortSubs(a: Submission, b: Submission) {
  const aStatus = a.status.toLowerCase();
  const bStatus = b.status.toLowerCase();

  if (aStatus === bStatus) {
    return 0;
  }

  if (aStatus == 'in_progress') {
    return -1;
  }

  if (bStatus === 'in_progress') {
    return 1;
  }

  if (aStatus === 'new') {
    return -1;
  }

  if (bStatus === 'new') {
    return 1;
  }

  return 0;
}

function formatSmartlingEntry(entry: SmartlingContentfulEntry): SmartlingContentfulEntry {
  return {
    ...entry,
    translationSubmissions: entry.translationSubmissions.slice().sort(sortSubs)
  };
}

export default class Sidebar extends React.Component<Props, State> {
  state: State = {
    smartlingEntry: null,
    token: window.localStorage.getItem('token') || '',
    refreshToken: window.localStorage.getItem('refreshToken') || '',
    showAllSubs: false,
    generalError: false,
  };

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    this.getJobs();
  }

  runAuthFlow = async (tryRefreshOnly = false) => {
    const refresh = await smartlingClient.refresh(this.state.refreshToken);

    if (tryRefreshOnly && refresh.failed) {
      this.setState({ token: '', refreshToken: '' });
    } else if (refresh.failed) {
      const smartlingWindow = window.open('/openauth', '', 'height=600,width=600,top=50,left=50');

      const listener = ({ data, source }: any) => {
        if (source !== smartlingWindow) {
          return;
        }

        const { token, refreshToken } = data;

        if (token) {
          this.setState({ token, refreshToken }, this.getJobs);

          if (smartlingWindow) {
            smartlingWindow.close();
          }

          window.removeEventListener('message', listener);
        }
      };

      window.addEventListener('message', listener);
    } else {
      this.setState({ token: refresh.token }, this.getJobs);
    }
  };

  getJobs = async () => {
    const { sdk, projectId } = this.props;
    const { token } = this.state;

    const res = await smartlingClient.getLinkedJobs(token, sdk.ids.space, projectId, sdk.ids.entry);

    if (res.code === 'AUTHENTICATION_ERROR') {
      this.runAuthFlow(true);
    } else if (res.code === 'SUCCESS') {
      this.setState({
        smartlingEntry: formatSmartlingEntry(res.data),
        showAllSubs: res.data.translationSubmissions.length <= SUBS_TO_SHOW
      });
    } else {
      this.setState({generalError: true});
    }
  };

  getLocaleByName(localeCode: string) {
    return this.props.sdk.locales.names[localeCode] || localeCode;
  }

  onShowAll = () => {
    this.setState({ showAllSubs: true });
  };

  linkToFile(sub: Submission) {
    window.open(
      `https://dashboard.smartling.com/app/projects/${this.props.projectId}/` +
        `content/content.html#translations/list/filter/locale:${sub.targetLocaleExternalId}|fileUri:${sub.fileUri}`
    );
  }

  render() {
    const { sdk, projectId } = this.props;
    const { smartlingEntry, token, showAllSubs, generalError } = this.state;
    const smartlingLink = makeSmartlingLink(projectId, sdk.ids.entry, sdk.ids.space);

    const requestButton = (
      <Button
        testId="request-translation"
        buttonType="muted"
        isFullWidth
        className="request-translation"
        onClick={() => window.open(smartlingLink)}>
        <Icon icon="ExternalLink" color="secondary" /> Request Translation
      </Button>
    );

    if (!token) {
      return (
        <>
          <Button
            testId="open-dialog"
            buttonType="primary"
            isFullWidth
            className="signin"
            onClick={() => this.runAuthFlow()}>
            Sign in with Smartling
          </Button>
          <br />
          {requestButton}
        </>
      );
    }

    let statusTag = (
      <div className="tag-loader">
        <SkeletonContainer>
          <SkeletonImage height={10} width={120} />
        </SkeletonContainer>
      </div>
    );

    let smartlingBody = (
      <div className="spinner">
        <Spinner />
      </div>
    );

    if (smartlingEntry) {
      const subsToShow = showAllSubs
        ? smartlingEntry.translationSubmissions
        : smartlingEntry.translationSubmissions.slice(0, SUBS_TO_SHOW);

      statusTag = (
        <Tag className="job-status" tagType={getStatusColor(smartlingEntry.assetStatus)}>
          {smartlingEntry.assetStatus}
        </Tag>
      );

      if (subsToShow.length) {
        smartlingBody = (
          <div className="smartling-entry">
            <div className="submission-list">
              <Paragraph className="info-p">Translation submissions</Paragraph>
              {subsToShow.map(sub => (
                <Card
                  key={sub.submissionId}
                  className="submission"
                  onClick={() => this.linkToFile(sub)}>
                  <div className="info">
                    <div className="locale">{this.getLocaleByName(sub.targetLocaleExternalId)}</div>
                    {sub.status.toLowerCase() === 'in_progress' && (
                      <Tooltip content={`${sub.progress}%`}>
                        <div className="progress-bar">
                          <div style={{ width: `${sub.progress}%` }} />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  <div className="status">
                    <Tag className="tag" tagType={getStatusColor(sub.status)}>
                      {formatSubmissionStatus(sub.status)}
                    </Tag>
                    <br />
                    {showSubmittedByStatus(sub.status) && (
                      <div className="date">Submitted {formatDate(sub.submitted)}</div>
                    )}
                  </div>
                </Card>
              ))}
              {!showAllSubs && (
                <TextLink onClick={this.onShowAll} className="show-all">
                  Show all ({smartlingEntry.translationSubmissions.length})
                </TextLink>
              )}
            </div>
          </div>
        );
      } else {
        statusTag = <></>;
        smartlingBody = <></>;
      }
    } else if (generalError) {
        statusTag = (
        <Tag className="job-status" tagType="negative">
          Disconnected
        </Tag>
        );

        smartlingBody = (
          <Note title="Connection error" noteType="negative" className="general-error">
            Please ensure that you have access to the connected Smartling project.
            <br />
            <TextLink href="https://contentful.com/developers/docs/extensibility/apps/smartling/" target="_blank" rel="noopener noreferrer">View documentation</TextLink>
          </Note>
        );
    }

    return (
      <>
        <div className="smartling-status">
          <div>
            <Paragraph className="info-p">Smartling status</Paragraph>
          </div>
          <div>{statusTag}</div>
        </div>
        {requestButton}
        {smartlingBody}
      </>
    );
  }
}
