import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  Adapter,
  AppInstallationProps,
  PlainClientAPI,
  SysLink,
  createClient,
} from 'contentful-management';
import sinon from 'sinon';
import { AppInstallationParameters, VercelPreviewUrlParts, VercelProject } from '../src/types';

export const makeMockPlainClient = (responses: any[], stub: sinon.SinonStub): PlainClientAPI => {
  for (const [callNumber, response] of responses.entries()) {
    stub.onCall(callNumber).returns(response);
  }
  const apiAdapter: Adapter = {
    makeRequest: async <T>(args: T) => {
      return stub(args);
    },
  };
  return createClient({ apiAdapter }, { type: 'plain' });
};

export const makeMockFetchResponse = (
  body: object,
  headers: Record<string, string> = {},
  status: number = 200
): Response => {
  const responseBody = JSON.stringify(body);
  return new Response(responseBody, { headers, status });
};

export const makeMockAppActionCallContext = (
  responses: any[],
  cmaStub = sinon.stub()
): AppActionCallContext => {
  return {
    cma: makeMockPlainClient(responses, cmaStub),
    appActionCallContext: {
      spaceId: 'space-id',
      environmentId: 'environment-id',
      appInstallationId: 'app-installation-id',
      userId: 'user-id',
      cmaHost: 'api.contentful.com',
      uploadHost: 'upload.contentful.com',
    },
  };
};

export const mockAppInstallationParameters: AppInstallationParameters = {
  vercelAccessToken: 'vercel-access-token',
  selectedProject: 'selected-project-id',
  contentTypePreviewPathSelections: [
    { contentType: 'blog', previewPath: '/blogs/{entry.fields.slug}' },
  ],
  selectedApiPath: 'api/enable-draft',
  teamId: 'vercel-team-id',
};

export const makeMockAppInstallation = (
  parameters = mockAppInstallationParameters
): AppInstallationProps => ({
  sys: {
    type: 'AppInstallation',
    appDefinition: {} as SysLink,
    environment: {} as SysLink,
    space: {} as SysLink,
    version: 1,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  parameters,
});

export const mockVercelProject: VercelProject = {
  accountId: 'team_SDwygrUbDOuHXlSrMdG7fZHc',
  speedInsights: {
    id: 'Tiq9w91TYOIlaDJFSb0NBpXQ0Qf',
    hasData: false,
  },
  autoExposeSystemEnvs: true,
  autoAssignCustomDomains: true,
  autoAssignCustomDomainsUpdatedBy: 'system',
  buildCommand: null,
  createdAt: 1703170299111,
  crons: {
    enabledAt: 1703170346067,
    disabledAt: null,
    updatedAt: 1711128571212,
    deploymentId: 'dpl_B8n2v6oPXrbZGQv7bUHzYPfeUgaf',
    definitions: [],
  },
  devCommand: null,
  directoryListing: false,
  env: [
    {
      target: ['development', 'preview', 'production'],
      configurationId: null,
      comment: '',
      id: 'Jigy8dVL2wI8zeFU',
      key: 'CONTENTFUL_PREVIEW_ACCESS_TOKEN',
      createdAt: 1710517671885,
      updatedAt: 1710517671885,
      createdBy: 'LTKTbMvie49uxnuTYn9zEjhv',
      updatedBy: null,
      type: 'encrypted',
      value:
        '0g+3TsFB8ls1My7OUmB70/lxpFV0GAdLqN4rSmeH0AaX8j8Bz4KgZqMyrO7LMEiekkB3gJx3O7Vh8PcBuFQmLw==',
    },
    {
      target: ['development', 'preview', 'production'],
      configurationId: null,
      id: '1w81qsPZOuNlodlt',
      key: 'CONTENTFUL_ACCESS_TOKEN',
      createdAt: 1710517671885,
      updatedAt: 1710517671885,
      createdBy: 'LTKTbMvie49uxnuTYn9zEjhv',
      updatedBy: null,
      type: 'encrypted',
      value:
        'JCxKVE3HlqliUGLnLEB1W2/2pa/LWvAur/K1fqmRaMmBieAknEfoUxPwDzGOPjh1X1AO1teQpY/ZmvmO7R7Knw==',
    },
    {
      target: ['development', 'preview', 'production'],
      configurationId: null,
      id: 'EMaK6IYPfuRcvCCy',
      key: 'CONTENTFUL_SPACE_ID',
      createdAt: 1710517671885,
      updatedAt: 1710517671885,
      createdBy: 'LTKTbMvie49uxnuTYn9zEjhv',
      updatedBy: null,
      type: 'encrypted',
      value: 'Qb12Brwd2DsmCF2yWuJdCFWA8oaRgsrkFRtN9u/VDqY=',
    },
    {
      target: ['development', 'preview', 'production'],
      configurationId: null,
      comment: '',
      id: 'zXPNO8UsLM2xmfe3',
      key: 'CONTENTFUL_VERCEL_PROTECTION_BYPASS',
      createdAt: 1711037915806,
      updatedAt: 1711037915806,
      createdBy: 'LTKTbMvie49uxnuTYn9zEjhv',
      updatedBy: null,
      type: 'encrypted',
      value:
        'k8N0uNwGjSOIyuLNsPvoRS+Kk900Qq4X8xjXuIhczm/GIAQ+r1XxY8+ukvtC+ezl2WshFeexNqpG32ccWid2SQ==',
    },
  ],
  framework: 'nextjs',
  gitForkProtection: true,
  gitLFS: false,
  id: 'prj_mzgQMzFXy9PujuckJcae6VmsrXvV',
  installCommand: null,
  lastRollbackTarget: null,
  lastAliasRequest: null,
  name: 'team-integrations-vercel-playground',
  nodeVersion: '18.x',
  outputDirectory: null,
  publicSource: null,
  rootDirectory: null,
  serverlessFunctionRegion: 'iad1',
  sourceFilesOutsideRootDirectory: true,
  ssoProtection: {
    deploymentType: 'prod_deployment_urls_and_all_previews',
  },
  updatedAt: 1711128571212,
  live: false,
  gitComments: {
    onCommit: false,
    onPullRequest: true,
  },
  webAnalytics: {
    id: 'I6tQG7iDnMY4rKDLWIluylNYo',
    enabledAt: 1703175145603,
  },
  link: {
    type: 'github',
    repo: 'team-integrations-vercel-playground',
    repoId: 734386089,
    org: 'contentful',
    gitCredentialId: 'cred_9aa5fcd7e14e4966aef8fd1f502af7e77dc653f7',
    productionBranch: 'main',
    createdAt: 1703170299062,
    updatedAt: 1703170299062,
    deployHooks: [],
  },
  latestDeployments: [
    {
      alias: [
        'team-integrations-vercel-playground.vercel.app',
        'team-integrations-vercel-playground-master.vercel.app',
        'team-integrations-vercel-playground-content-preview.vercel.app',
        'team-integrations-vercel-playgroun-contentful-team-integrations.vercel.app',
        'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      ],
      aliasAssigned: 1711128571437,
      aliasError: null,
      automaticAliases: [
        'team-integrations-vercel-playgroun-contentful-team-integrations.vercel.app',
        'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      ],
      builds: [],
      createdAt: 1711128537140,
      createdIn: 'sfo1',
      creator: {
        uid: '5fVY0Vdwk3uJcPfIvESUocSk',
        email: 'matt.gordon@contentful.com',
        username: 'mattgordon-contentfulc',
        githubLogin: 'matthew-gordon',
      },
      deploymentHostname: 'team-integrations-vercel-playground-gqmys2z3c',
      forced: false,
      id: 'dpl_B8n2v6oPXrbZGQv7bUHzYPfeUgaf',
      meta: {
        githubCommitAuthorName: 'Matthew Gordon',
        githubCommitMessage: 'Update README.md',
        githubCommitOrg: 'contentful',
        githubCommitRef: 'main',
        githubCommitRepo: 'team-integrations-vercel-playground',
        githubCommitSha: 'c3a474c2426ad1215775ae84507b57471b1e28d2',
        githubDeployment: '1',
        githubOrg: 'contentful',
        githubRepo: 'team-integrations-vercel-playground',
        githubRepoOwnerType: 'Organization',
        githubCommitRepoId: '734386089',
        githubRepoId: '734386089',
        githubRepoVisibility: 'private',
        githubCommitAuthorLogin: 'matthew-gordon',
        branchAlias: 'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      },
      name: 'team-integrations-vercel-playground',
      plan: 'enterprise',
      private: true,
      readyState: 'READY',
      readySubstate: 'PROMOTED',
      target: 'production',
      teamId: 'team_SDwygrUbDOuHXlSrMdG7fZHc',
      type: 'LAMBDAS',
      url: 'team-integrations-vercel-playground-gqmys2z3c.vercel.app',
      userId: '5fVY0Vdwk3uJcPfIvESUocSk',
      withCache: false,
      buildingAt: 1711128538194,
      readyAt: 1711128570853,
      previewCommentsEnabled: true,
    },
    {
      alias: [
        'team-integrations-vercel-playground.vercel.app',
        'team-integrations-vercel-playground-master.vercel.app',
        'team-integrations-vercel-playground-content-preview.vercel.app',
        'team-integrations-vercel-playgroun-contentful-team-integrations.vercel.app',
        'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      ],
      aliasAssigned: 1711119748003,
      aliasError: null,
      automaticAliases: [
        'team-integrations-vercel-playgroun-contentful-team-integrations.vercel.app',
        'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      ],
      builds: [],
      createdAt: 1711119707432,
      createdIn: 'sfo1',
      creator: {
        uid: '5fVY0Vdwk3uJcPfIvESUocSk',
        email: 'matt.gordon@contentful.com',
        username: 'mattgordon-contentfulc',
        githubLogin: 'matthew-gordon',
      },
      deploymentHostname: 'team-integrations-vercel-playground-xme93fvby',
      forced: false,
      id: 'dpl_HC4HxvjmvnyaBPP9or1qjQPjYAtu',
      meta: {
        githubCommitAuthorName: 'Matt Gordon',
        githubCommitMessage: 'Fix title',
        githubCommitOrg: 'contentful',
        githubCommitRef: 'main',
        githubCommitRepo: 'team-integrations-vercel-playground',
        githubCommitSha: 'd4cf1251f9e77e6898bea9739ee941262091810c',
        githubDeployment: '1',
        githubOrg: 'contentful',
        githubRepo: 'team-integrations-vercel-playground',
        githubRepoOwnerType: 'Organization',
        githubCommitRepoId: '734386089',
        githubRepoId: '734386089',
        githubRepoVisibility: 'private',
        githubCommitAuthorLogin: 'matthew-gordon',
        branchAlias: 'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      },
      name: 'team-integrations-vercel-playground',
      plan: 'enterprise',
      private: true,
      readyState: 'READY',
      readySubstate: 'PROMOTED',
      target: 'production',
      teamId: 'team_SDwygrUbDOuHXlSrMdG7fZHc',
      type: 'LAMBDAS',
      url: 'team-integrations-vercel-playground-xme93fvby.vercel.app',
      userId: '5fVY0Vdwk3uJcPfIvESUocSk',
      withCache: false,
      buildingAt: 1711119708480,
      readyAt: 1711119747547,
      previewCommentsEnabled: true,
    },
  ],
  targets: {
    production: {
      alias: [
        'team-integrations-vercel-playground.vercel.app',
        'team-integrations-vercel-playground-master.vercel.app',
        'team-integrations-vercel-playground-content-preview.vercel.app',
        'team-integrations-vercel-playgroun-contentful-team-integrations.vercel.app',
        'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      ],
      aliasAssigned: 1711128571437,
      aliasError: null,
      automaticAliases: [
        'team-integrations-vercel-playgroun-contentful-team-integrations.vercel.app',
        'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      ],
      builds: [],
      createdAt: 1711128537140,
      createdIn: 'sfo1',
      creator: {
        uid: '5fVY0Vdwk3uJcPfIvESUocSk',
        email: 'matt.gordon@contentful.com',
        username: 'mattgordon-contentfulc',
        githubLogin: 'matthew-gordon',
      },
      deploymentHostname: 'team-integrations-vercel-playground-gqmys2z3c',
      forced: false,
      id: 'dpl_B8n2v6oPXrbZGQv7bUHzYPfeUgaf',
      meta: {
        githubCommitAuthorName: 'Matthew Gordon',
        githubCommitMessage: 'Update README.md',
        githubCommitOrg: 'contentful',
        githubCommitRef: 'main',
        githubCommitRepo: 'team-integrations-vercel-playground',
        githubCommitSha: 'c3a474c2426ad1215775ae84507b57471b1e28d2',
        githubDeployment: '1',
        githubOrg: 'contentful',
        githubRepo: 'team-integrations-vercel-playground',
        githubRepoOwnerType: 'Organization',
        githubCommitRepoId: '734386089',
        githubRepoId: '734386089',
        githubRepoVisibility: 'private',
        githubCommitAuthorLogin: 'matthew-gordon',
        branchAlias: 'team-integrations-verce-git-523eea-contentful-team-integrations.vercel.app',
      },
      name: 'team-integrations-vercel-playground',
      plan: 'enterprise',
      private: true,
      readyState: 'READY',
      readySubstate: 'PROMOTED',
      target: 'production',
      teamId: 'team_SDwygrUbDOuHXlSrMdG7fZHc',
      type: 'LAMBDAS',
      url: 'team-integrations-vercel-playground-gqmys2z3c.vercel.app',
      userId: '5fVY0Vdwk3uJcPfIvESUocSk',
      withCache: false,
      buildingAt: 1711128538194,
      readyAt: 1711128570853,
      previewCommentsEnabled: true,
    },
  },
  protectionBypass: {
    ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7: {
      createdAt: 1707867069525,
      createdBy: 'LTKTbMvie49uxnuTYn9zEjhv',
      scope: 'automation-bypass',
    },
  },
};
