interface ContentfulEntry {
  space: string;
  environment: string;
  entry: string;
}

interface JiraCloudResource {
  avatarUrl: string;
  id: string;
  name: string;
  scopes: string[];
  url: string;
}

interface CloudAccountsResponse {
  error: boolean;
  resources: JiraCloudResource[];
}

interface CloudProjectsResource {
  isLast: boolean;
  maxResults: number;
  self: string;
  startAt: number;
  total: number;
  values: CloudProject[];
}

interface CloudProjectResponse {
  error: boolean;
  projects: CloudProject[];
}

interface CloudProject {
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  expand: string;
  id: string;
  isPrivate: boolean;
  key: string;
  name: string;
  projectTypeKey: string;
  properties: object;
  self: string;
  simplified: boolean;
  style: string;
}

interface JiraIssueStatus {
  description: string;
  iconUrl: string;
  id: string;
  name: string;
  self: string;
  statusCategory: {
    colorName: string;
    id: number;
    key: string;
    name: string;
    self: string;
  };
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    priority: IssuePriority;
    assignee: IssueAssignee | null;
    status: JiraIssueStatus;
    issuetype: ProjectIssueType;
  };
}

interface IssueAssignee {
  accountId: string;
  accountType: string;
  active: boolean;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  displayName: string;
  key: string;
  name: string;
  self: string;
  timeZone: string;
}

interface IssuePriority {
  iconUrl: string;
  id: string;
  name: string;
  self: string;
}

interface FormattedIssue {
  link: string;
  key: string;
  summary: string;
  priority: IssuePriority;
  assignee: IssueAssignee | null;
  status: JiraIssueStatus;
  issuetype: ProjectIssueType;
}

declare enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

interface RequestOptions {
  method: HTTPMethod;
  data?: object;
}

interface IssuesResponse {
  issues: FormattedIssue[];
  error: 'unauthorized_error' | 'general_error' | null;
}

interface SingleIssueResponse {
  error: boolean;
  issue: FormattedIssue | null;
}

interface ProjectIssueType {
  avatarId: number;
  description: string;
  iconUrl: string;
  id: string;
  name: string;
  self: string;
  subtask: boolean;
}

interface UrnRecordsResponse {
  error: boolean;
  /**URN record
   * ex: `ctf:{spaceId}:{environmentId}:{entryId}`
   */
  records: string[];
}

interface InstallationParameters {
  projectId: string;
  resourceId: string;
  resourceUrl: string;
}

interface CurrentState {
  [key: string]: object;
}
