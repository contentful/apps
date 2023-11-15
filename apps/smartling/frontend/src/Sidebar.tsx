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
  Note,
  Flex,
} from '@contentful/forma-36-react-components';
import smartlingClient from './smartlingClient';

interface Props {
  sdk: SidebarExtensionSDK;
  projectId: string;
}

interface State {
  smartlingEntry: SmartlingContentfulEntry | null;
  token: string | null;
  refreshToken: string | null;
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
    minute: 'numeric',
  });
}

function sortSubs(a: Submission, b: Submission) {
  const aStatus = a.status.toLowerCase();
  const bStatus = b.status.toLowerCase();

  if (aStatus === bStatus) {
    return 0;
  }

  if (aStatus === 'in_progress') {
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

function submissionStatusLongText(status: string) {
  switch (status.toLowerCase()) {
    case 'not translated':
      return `The asset has never been submitted for translation`;
    case 'new':
      return `The asset is in the process of being sent for a new translation request. For example, if changes
        were made to the source content and your Contentful Connector is configured to automatically send the
        new content for translation. The asset could be sitting in submission queue or sitting in Awaiting Authorization.`;
    case 'in progress':
    case 'in_progress':
      return `The asset has been successfully sent to Smartling from Contentful, and the translation process
        has commenced but is not yet completed. If there is a case where translations are complete, but a network
        issue occurs, the translations will remain in progress until Smartling delivers the translations to Contentful
        on a successful retry.`;
    case 'canceled':
    case 'cancelled':
      return 'The job associated with this asset has been cancelled.';
    case 'completed':
      return 'Translations were successfully delivered from Smartling to Contentful.';
    case 'failed':
      return `The asset submission failed, or the translation delivery failed. A number of reasons can result in a
        failed status, but some of the most common are due to invalid regex causing placeholder issues, or the target
        languages are disabled in Contentful.`;
    default:
      return 'This status is unknown.';
  }
}

function formatSmartlingEntry(entry: SmartlingContentfulEntry): SmartlingContentfulEntry {
  return {
    ...entry,
    translationSubmissions: entry.translationSubmissions.slice().sort(sortSubs),
  };
}

export default class Sidebar extends React.Component<Props, State> {
  state: State = {
    smartlingEntry: null,
    token: window.localStorage.getItem('token') ?? null,
    refreshToken: window.localStorage.getItem('refreshToken') ?? null,
    showAllSubs: false,
    generalError: false,
  };

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    this.getJobs();
  }

  runAuthFlow = async (tryRefreshOnly = false) => {
    const refresh = await smartlingClient.refresh(this.state.refreshToken as string);

    if (tryRefreshOnly && refresh.failed) {
      this.setState({ token: null, refreshToken: null });
    } else if (refresh.failed) {
      const smartlingWindow = window.open('/openauth', '', 'height=600,width=600,top=50,left=50');

      const listener = ({ data, source }: any) => {
        if (source !== smartlingWindow) {
          return;
        }

        const { token, refreshToken } = data;

        if (token) {
          this.setState({ token, refreshToken }, this.getJobs);

          window.localStorage.setItem('token', token);
          window.localStorage.setItem('refreshToken', refreshToken);

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

    const res = await smartlingClient.getLinkedJobs(
      token as string,
      sdk.ids.space,
      projectId,
      sdk.ids.entry
    );

    if (res.code === 'AUTHENTICATION_ERROR') {
      this.runAuthFlow(true);
    } else if (res.code === 'SUCCESS') {
      this.setState({
        smartlingEntry: formatSmartlingEntry(res.data),
        showAllSubs: res.data.translationSubmissions.length <= SUBS_TO_SHOW,
      });
    } else {
      this.setState({ generalError: true });
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
        <Flex justifyContent="start" alignItems="bottom">
          <Tag className="job-status" tagType={getStatusColor(smartlingEntry.assetStatus)}>
            {smartlingEntry.assetStatus}
          </Tag>
          <Tooltip
            place="top"
            targetWrapperClassName="tooltip"
            content={submissionStatusLongText(smartlingEntry.assetStatus)}>
            <Icon icon="InfoCircle" />
          </Tooltip>
        </Flex>
      );

      if (subsToShow.length) {
        smartlingBody = (
          <div className="smartling-entry">
            <div className="submission-list">
              <Paragraph className="info-p">Translation submissions</Paragraph>
              {subsToShow.map((sub) => (
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
          <TextLink
            href="https://contentful.com/developers/docs/extensibility/apps/smartling/"
            target="_blank"
            rel="noopener noreferrer">
            View documentation
          </TextLink>
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
        <Paragraph className="smartling-more-info">
          <TextLink
            href="https://help.smartling.com/hc/en-us/articles/360000546974-Contentful-Connector-Overview"
            target="_blank"
            rel="noopener">
            Learn how Smartling works with Contentful&nbsp;
            <Icon size="tiny" icon="ExternalLink" color="secondary" />
          </TextLink>
        </Paragraph>
      </>
    );
  }
}
