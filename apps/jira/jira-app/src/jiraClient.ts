enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}
export default class JiraClient {
  private readonly token: string;
  private readonly projectId: string;
  private readonly jiraUrl: string;
  private readonly baseUrl: string;
  unauthorizedHandler: () => void;
  private readonly CONTENTFUL_LINK_PROPERTY_KEY = 'contentfulLink';

  constructor(
    token: string,
    projectId: string,
    cloudId: string,
    jiraUrl: string,
    unauthorizedHandler = () => {}
  ) {
    this.token = token;
    this.projectId = projectId;
    this.jiraUrl = jiraUrl;
    this.baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2`;
    this.unauthorizedHandler = unauthorizedHandler;
  }

  /**Internal use for building the Jira request using the provided `token`.
   * @param url The endpoint of the Jira request
   * @param options The http options for the Jira request
   */
  private request = async (url: string, options?: RequestOptions) => {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      method: options ? options.method : HTTPMethod.GET,
      body: options ? JSON.stringify(options.data) : undefined
    });

    if (response.status === 401) {
      this.unauthorizedHandler();
    }

    return response;
  };

  /** Builds the URN for an entry.
   * @returns URN special string format which is saved
   * in the Jira Entity Properties storage
   * ex: `'ctf:{spaceId}:{environmentId}:{entryId}'`
   */
  private buildEntryUrn = (entry: ContentfulEntry) => {
    return `ctf:${entry.space}:${entry.environment}:${entry.entry}`;
  };

  /**Formats raw Jira issues response into custom format for app.*/
  private formatIssue = (jiraIssue: JiraIssue): FormattedIssue => {
    return {
      link: `${this.jiraUrl}/browse/${jiraIssue.key}`,
      key: jiraIssue.key,
      summary: jiraIssue.fields.summary,
      priority: jiraIssue.fields.priority,
      assignee: jiraIssue.fields.assignee,
      status: jiraIssue.fields.status,
      issuetype: jiraIssue.fields.issuetype
    };
  };

  /**Make a JQL query and return an `IssuesResponse` */
  private async makeJqlQuery(jql: string): Promise<IssuesResponse> {
    try {
      const result = await this.request(`/search?jql=${jql}`);

      if (result.ok) {
        const { issues }: { issues: JiraIssue[] } = await result.json();
        return {
          error: null,
          issues: issues.map(this.formatIssue)
        };
      } else if (result.status === 401 || result.status === 403) {
        return {
          error: 'unauthorized_error',
          issues: [],
        };
      } 

      return {
        error: 'general_error',
        issues: []
      };
    } catch (e) {
      return {
        error: 'general_error',
        issues: []
      };
    }
  }

  /**Get the ContentfulLink Jira Entity Property for the `issueId */
  private async getContentfulLink(issueId: string): Promise<UrnRecordsResponse> {
    const url = `/issue/${issueId}/properties/${this.CONTENTFUL_LINK_PROPERTY_KEY}`;

    try {
      const result = await this.request(url);

      if (!result.ok) {
        return {
          error: true,
          records: []
        };
      }

      const body = await result.json();
      const linkData = body.value;

      if (!Array.isArray(linkData.records)) {
        return {
          error: false,
          records: []
        };
      }

      return {
        error: false,
        records: linkData.records as string[]
      };
    } catch (e) {
      return {
        error: true,
        records: []
      };
    }
  }

  /** Add to records array
   * @param entryUrn The URN of the entry to remove
   * @param records Array of URNS
   */
  private addRecord(entryUrn: string, records: string[]): string[] {
    return [...records, entryUrn];
  }

  /** Remove from records array
   * @param entryUrn The URN of the entry to remove
   * @param records Array of URNS
   */
  private removeRecord(entryUrn: string, records: string[]): string[] {
    return records.filter(record => record !== entryUrn);
  }

  /**Internal method for adding and removing ContentfulLink entity properties.
   * @returns boolean to indicate if operation was successful or not
   */
  private async manipulateContentfulLinks(
    entry: ContentfulEntry,
    issueId: string,
    modifyFn: (entry: string, records: string[]) => string[]
  ): Promise<boolean> {
    const existingLinks = await this.getContentfulLink(issueId);
    const url = `/issue/${issueId}/properties/${this.CONTENTFUL_LINK_PROPERTY_KEY}`;
    const updatedLinks = modifyFn(this.buildEntryUrn(entry), existingLinks.records);

    try {
      const result = await this.request(url, {
        method: HTTPMethod.PUT,
        data: { records: updatedLinks }
      });

      return result.ok;
    } catch (e) {
      return false;
    }
  }

  /**Add a Jira issue to a Contentful Entry
   * @returns boolean to indicate if issue was linked to entry
   */
  public async addContentfulLink(entry: ContentfulEntry, issueId: string) {
    return this.manipulateContentfulLinks(entry, issueId, this.addRecord);
  }

  /**Remove a Jira issue from a Contentful Entry
   * @returns boolean to indicate if issue was removed from entry
   */
  public async removeContentfulLink(entry: ContentfulEntry, issueId: string) {
    return this.manipulateContentfulLinks(entry, issueId, this.removeRecord);
  }

  /** Get the Jira issues for a specific entry. */
  public async getIssuesForEntry(entry: ContentfulEntry): Promise<IssuesResponse> {
    const jql = encodeURIComponent(
      `issue.property[contentfulLink].records = "${this.buildEntryUrn(entry)}"`
    );

    return this.makeJqlQuery(jql);
  }

  /**Search for Jira issues given some arbitrary search text. This
   * will search for the summary, description or id.
   */
  public async searchIssues(searchText: string): Promise<IssuesResponse> {
    const summaryJql = encodeURIComponent(
      `project="${this.projectId}" AND summary~"${searchText}*"`
    );

    const issueKeyJql = encodeURIComponent(
      `project="${this.projectId}" AND issueKey="${searchText}"`
    );

    const [summaryData, issueData] = await Promise.all([
      this.makeJqlQuery(summaryJql),
      this.makeJqlQuery(issueKeyJql)
    ]);

    return {
      issues: [...summaryData.issues, ...issueData.issues],
      error: summaryData.error || issueData.error
    };
  }

  /**Get the current user's cloud resources. This is good for finding which
   * cloudIds the user can connect to.
   * @param token oauth token
   */
  public static async getCloudAccounts(token: string): Promise<CloudAccountsResponse> {
    try {
      const result = await window.fetch(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!result.ok) {
        throw void null;
      }

      const resources: JiraCloudResource[] = await result.json();

      return {
        error: false,
        resources
      };
    } catch (e) {
      return {
        error: true,
        resources: []
      };
    }
  }

  /**Get projects for the given cloud instance.
   * @param cloudId The id of the cloud instance to find projects in.
   * @param token oauth token.
   */
  public static async getProjects(cloudId: string, token: string): Promise<CloudProjectResponse> {
    try {
      const result = await window.fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2/project/search`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!result.ok) {
        throw void null;
      }

      const res: CloudProjectsResource = await result.json();

      return {
        error: false,
        projects: res.values
      };
    } catch (e) {
      return {
        error: true,
        projects: []
      };
    }
  }
}
