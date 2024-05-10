export default class OptimizelyClient {
  constructor({ project, accessToken, onReauth }) {
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new Error('You must provide a valid access token!');
    }

    this.expires = Date.now() + 1 * 60 * 1000;
    this.accessToken = accessToken;
    this.project = project;
    this.baseURL = 'https://api.optimizely.com/v2';
    this.fxBaseUrl = 'https://api.optimizely.com/flags/v1';
    this.onReauth = onReauth;
  }

  makeRequest = async (url) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }

    // reauthing should hopefully fix the issue
    this.onReauth();
    return Promise.reject(new Error(`request failed for url: ${url} with status: ${response.status}`));
  };

  _getItemsPerPage = async (item) => {
    let items = [];
    const PER_PAGE = 100;
    const MAX_REQUESTS = 10;

    for (let i = 1; i <= MAX_REQUESTS; i++) {
      const results = await this.makeRequest(this._getItemsUrl(PER_PAGE, i, item));
      items = [...items, ...results];
      if (results.length < PER_PAGE) {
        break;
      }
    }

    if (item === 'experiment') {
      items = items.filter((experiment) => {
        return experiment.status !== 'archived';
      });
    }

    items = items.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    return items;
  };

  _getItemsUrl = (perPage, page, item) => {
    switch (item) {
      case 'project':
        return `${this.baseURL}/projects?per_page=${perPage.toString()}&page=${page.toString()}`;
      case 'experiment':
        return `${this.baseURL}/experiments?project_id=${
          this.project
        }&per_page=${perPage.toString()}&page=${page.toString()}`;
      default:
        return '';
    }
  };

  getProjects = async () => {
    const allProjects = await this._getItemsPerPage('project');
    return allProjects.filter((project) => project.status === 'active');
  }

  getProject = async (projectId) => {
    return this.makeRequest(`${this.baseURL}/projects/${projectId}`);
  };

  getProjectEnvironments = async (projectId) => {
    return this.makeRequest(`${this.baseURL}/environments?project_id=${projectId}`);
  }

  getExperiment = (experimentId) => {
    return this.makeRequest(`${this.baseURL}/experiments/${experimentId}`);
  };

  getExperiments = async () => {
    return this._getItemsPerPage('experiment');
  };

  getRules = async () => {
    let url = `/projects/${this.project}/rules` +
      '?rule_types=a/b,multi_armed_bandit&archived=false&page_window=1&per_page=100';

    let items = [];

    while(true) {
      const response = await this.makeRequest(`${this.fxBaseUrl}${url}`);
      if (response.items) {
        items = [...items, ...response.items];
      }
      if (response.next_url) {
        ([url] = response.next_url);
      } else {
        break;
      }
    }
    return items;
  };

  getRule = async (flagKey, ruleKey, environment) => {
    return this.makeRequest(`${this.fxBaseUrl}/projects/${this.project}/flags/${flagKey}/environments/${environment}/rules/${ruleKey}`);
  }

  getExperimentResults = (experimentId) => {
    return this.makeRequest(`${this.baseURL}/experiments/${experimentId}/results`);
  };
}

export const getResultsUrl = (projectId, campaignUrl, experimentId) => {
  return `https://app.optimizely.com/v2/projects/${projectId}/results/${campaignUrl}/experiments/${experimentId}`;
};
