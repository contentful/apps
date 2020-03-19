import fetchMock from 'fetch-mock';

fetchMock.get(
  'https://api.atlassian.com/oauth/token/accessible-resources',
  [
    {
      id: '11111111-1111-1111-1111-111111111111',
      url: 'https://test.atlassian.net',
      name: 'test1',
      scopes: ['write:jira-work', 'read:jira-work', 'read:jira-user'],
      avatarUrl: 'https://site-admin-avatar-cdn.prod.public.atl-paas.net/avatars/240/triangle.png'
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      url: 'https://test2.atlassian.net',
      name: 'test2',
      scopes: ['write:jira-work', 'read:jira-work', 'read:jira-user'],
      avatarUrl: 'https://site-admin-avatar-cdn.prod.public.atl-paas.net/avatars/240/flag.png'
    }
  ],
  {
    headers: {
      Authorization: 'Bearer 123'
    }
  }
);

fetchMock.get(
  'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/project/search?query=extensibility',
  {
    self:
      'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/project/search?maxResults=50&startAt=0',
    nMKEPage:
      'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/project/search?maxResults=50&startAt=50',
    maxResults: 50,
    startAt: 0,
    total: 82,
    isLast: false,
    values: [
      {
        expand: 'description,lead,issueTypes,url,projectKeys,permissions,insight',
        self:
          'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/project/10555',
        id: '10555',
        key: 'MKE',
        name: 'Project name 2',
        avatarUrls: {
          '48x48':
            'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?pid=10555&avatarId=10981',
          '24x24':
            'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?size=small&s=small&pid=10555&avatarId=10981',
          '16x16':
            'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?size=xsmall&s=xsmall&pid=10555&avatarId=10981',
          '32x32':
            'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?size=medium&s=medium&pid=10555&avatarId=10981'
        },
        projectCategory: {
          self:
            'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/projectCategory/10002',
          id: '10002',
          name: 'Product Development',
          description: ''
        },
        projectTypeKey: 'software',
        simplified: false,
        style: 'classic',
        isPrivate: false,
        properties: {}
      }
    ]
  },
  {
    headers: {
      Authorization: 'Bearer 123',
      'Content-Type': 'application/json'
    }
  }
);

fetchMock.get(
  'https://api.atlassian.com/ex/jira/cloud-id/rest/api/2/search?jql=issue.property%5BcontentfulLink%5D.records%20%3D%20%22ctf%3Atest-space%3Amaster%3Aundefined%22',
  {
    expand: 'schema,names',
    startAt: 0,
    maxResults: 50,
    total: 2,
    issues: [
      {
        expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
        id: '10049',
        self:
          'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issue/10049',
        key: 'KEY-50',
        fields: {
          statuscategorychangedate: '2019-11-15T10:16:15.928-0600',
          issuetype: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issuetype/10002',
            id: '10002',
            description: 'A small, distinct piece of work.',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/viewavatar?size=medium&avatarId=10318&avatarType=issuetype',
            name: 'Task',
            subtask: false,
            avatarId: 10318
          },
          timespent: null,
          customfield_10030: null,
          customfield_10031: null,
          project: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/project/10000',
            id: '10000',
            key: 'KEY',
            name: 'Project Name',
            projectTypeKey: 'software',
            simplified: false,
            avatarUrls: {
              '48x48':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?pid=10000&avatarId=10422',
              '24x24':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?size=small&s=small&pid=10000&avatarId=10422',
              '16x16':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?size=xsmall&s=xsmall&pid=10000&avatarId=10422',
              '32x32':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?size=medium&s=medium&pid=10000&avatarId=10422'
            }
          },
          fixVersions: [],
          aggregatetimespent: null,
          resolution: null,
          customfield_10029: null,
          resolutiondate: null,
          workratio: -1,
          lastViewed: '2019-12-05T08:16:01.178-0600',
          watches: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issue/KEY-50/watchers',
            watchCount: 1,
            isWatching: false
          },
          created: '2019-11-15T10:16:15.838-0600',
          customfield_10020: null,
          customfield_10021: null,
          customfield_10022: null,
          priority: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/priority/3',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/images/icons/priorities/medium.svg',
            name: 'Medium',
            id: '3'
          },
          customfield_10023: null,
          labels: [],
          customfield_10016: null,
          customfield_10017: null,
          customfield_10018: {
            hasEpicLinkFieldDependency: false,
            showField: false,
            nonEditableReason: {
              reason: 'PLUGIN_LICENSE_ERROR',
              message: 'Portfolio for Jira must be licensed for the Parent Link to be available.'
            }
          },
          customfield_10019: '0|i0000f:',
          aggregatetimeoriginalestimate: null,
          timeestimate: null,
          versions: [],
          issuelinks: [],
          assignee: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/user?accountId=111111111111111111111111',
            name: 'dean.anderson',
            key: 'dean.anderson',
            accountId: '111111111111111111111111',
            emailAddress: 'dean.anderson@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=32&s=32'
            },
            displayName: 'Dean Anderson',
            active: true,
            timeZone: 'America/Chicago',
            accountType: 'atlassian'
          },
          updated: '2019-12-05T08:16:01.487-0600',
          status: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/status/10000',
            description: '',
            iconUrl: 'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/',
            name: 'To Do',
            id: '10000',
            statusCategory: {
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/statuscategory/2',
              id: 2,
              key: 'new',
              colorName: 'blue-gray',
              name: 'To Do'
            }
          },
          components: [],
          timeoriginalestimate: null,
          description: 'Issue must be done',
          customfield_10010: null,
          customfield_10014: null,
          customfield_10015: null,
          customfield_10005: null,
          customfield_10006: null,
          security: null,
          customfield_10007: null,
          customfield_10008: null,
          aggregatetimeestimate: null,
          customfield_10009: null,
          summary: 'Test issue 1',
          creator: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/user?accountId=111111111111111111111112',
            name: 'marc.aurel',
            key: 'marc.aurel',
            accountId: '111111111111111111111112',
            emailAddress: 'marc.aurel@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=32&s=32'
            },
            displayName: 'Marc Aurel',
            active: true,
            timeZone: 'America/Chicago',
            accountType: 'atlassian'
          },
          subtasks: [],
          reporter: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/user?accountId=111111111111111111111112',
            name: 'marc.aurel',
            key: 'marc.aurel',
            accountId: '111111111111111111111112',
            emailAddress: 'marc.aurel@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=32&s=32'
            },
            displayName: 'Marc Aurel',
            active: true,
            timeZone: 'America/Chicago',
            accountType: 'atlassian'
          },
          aggregateprogress: { progress: 0, total: 0 },
          customfield_10000: '{}',
          customfield_10001: null,
          customfield_10002: null,
          customfield_10003: null,
          customfield_10004: null,
          environment: null,
          duedate: null,
          progress: { progress: 0, total: 0 },
          votes: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issue/KEY-50/votes',
            votes: 0,
            hasVoted: false
          }
        }
      },
      {
        expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
        id: '10046',
        self:
          'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issue/10046',
        key: 'KEY-47',
        fields: {
          statuscategorychangedate: '2019-11-22T04:27:01.559-0600',
          issuetype: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issuetype/10001',
            id: '10001',
            description: 'Functionality or a feature expressed as a user goal.',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/viewavatar?size=medium&avatarId=10315&avatarType=issuetype',
            name: 'Story',
            subtask: false,
            avatarId: 10315
          },
          timespent: null,
          customfield_10030: null,
          project: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/project/10000',
            id: '10000',
            key: 'KEY',
            name: 'KEYIt',
            projectTypeKey: 'software',
            simplified: false,
            avatarUrls: {
              '48x48':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?pid=10000&avatarId=10422',
              '24x24':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?size=small&s=small&pid=10000&avatarId=10422',
              '16x16':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?size=xsmall&s=xsmall&pid=10000&avatarId=10422',
              '32x32':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/secure/projectavatar?size=medium&s=medium&pid=10000&avatarId=10422'
            }
          },
          customfield_10031: null,
          fixVersions: [],
          aggregatetimespent: null,
          resolution: null,
          customfield_10029: null,
          resolutiondate: null,
          workratio: -1,
          watches: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issue/KEY-47/watchers',
            watchCount: 1,
            isWatching: false
          },
          lastViewed: '2019-11-27T10:49:27.357-0600',
          created: '2019-11-15T10:06:17.663-0600',
          customfield_10020: null,
          customfield_10021: null,
          customfield_10022: null,
          priority: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/priority/3',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/images/icons/priorities/medium.svg',
            name: 'Medium',
            id: '3'
          },
          customfield_10023: null,
          customfield_10024: null,
          labels: [],
          customfield_10016: null,
          customfield_10017: null,
          customfield_10018: {
            hasEpicLinkFieldDependency: false,
            showField: false,
            nonEditableReason: {
              reason: 'PLUGIN_LICENSE_ERROR',
              message: 'Portfolio for Jira must be licensed for the Parent Link to be available.'
            }
          },
          customfield_10019: '0|hzzzzz:',
          aggregatetimeoriginalestimate: null,
          timeestimate: null,
          versions: [],
          issuelinks: [],
          assignee: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/user?accountId=5dcc3f7705b5ae0ddd6fe79e',
            name: 'fschultz02+KEYit',
            key: 'fschultz02+KEYit',
            accountId: '5dcc3f7705b5ae0ddd6fe79e',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5dcc3f7705b5ae0ddd6fe79e/f2395ed2-b511-4f9a-8744-640e0b6f94a0/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5dcc3f7705b5ae0ddd6fe79e/f2395ed2-b511-4f9a-8744-640e0b6f94a0/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5dcc3f7705b5ae0ddd6fe79e/f2395ed2-b511-4f9a-8744-640e0b6f94a0/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5dcc3f7705b5ae0ddd6fe79e/f2395ed2-b511-4f9a-8744-640e0b6f94a0/128?size=32&s=32'
            },
            displayName: 'Fabian Schultz',
            active: true,
            timeZone: 'America/Chicago',
            accountType: 'atlassian'
          },
          updated: '2019-11-22T04:27:01.558-0600',
          status: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/status/10000',
            description: '',
            iconUrl: 'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/',
            name: 'To Do',
            id: '10000',
            statusCategory: {
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/statuscategory/2',
              id: 2,
              key: 'new',
              colorName: 'blue-gray',
              name: 'To Do'
            }
          },
          components: [],
          timeoriginalestimate: null,
          description: 'update getting started page to reflect new release',
          customfield_10010: null,
          customfield_10014: null,
          customfield_10015: null,
          customfield_10005: null,
          customfield_10006: null,
          security: null,
          customfield_10007: null,
          customfield_10008: null,
          aggregatetimeestimate: null,
          customfield_10009: null,
          summary: 'Update getting started page to reflect new release',
          creator: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/user?accountId=111111111111111111111112',
            name: 'marc.aurel',
            key: 'marc.aurel',
            accountId: '111111111111111111111112',
            emailAddress: 'marc.aurel@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=32&s=32'
            },
            displayName: 'Marc Aurel',
            active: true,
            timeZone: 'America/Chicago',
            accountType: 'atlassian'
          },
          subtasks: [],
          reporter: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/user?accountId=111111111111111111111112',
            name: 'marc.aurel',
            key: 'marc.aurel',
            accountId: '111111111111111111111112',
            emailAddress: 'marc.aurel@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111112/11111111-1111-1111-1111-111111111114/128?size=32&s=32'
            },
            displayName: 'Marc Aurel',
            active: true,
            timeZone: 'America/Chicago',
            accountType: 'atlassian'
          },
          customfield_10000: '{}',
          aggregateprogress: { progress: 0, total: 0 },
          customfield_10001: null,
          customfield_10002: null,
          customfield_10003: null,
          customfield_10004: null,
          environment: null,
          duedate: null,
          progress: { progress: 0, total: 0 },
          votes: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111111/rest/api/2/issue/KEY-47/votes',
            votes: 0,
            hasVoted: false
          }
        }
      }
    ]
  }
);

fetchMock.get(
  'https://api.atlassian.com/ex/jira/cloud-id/rest/api/2/search?jql=project%3D%221000%22%20AND%20issueKey%3D%22MKE-1389%22',
  {
    expand: 'names,schema',
    startAt: 0,
    maxResults: 50,
    total: 1,
    issues: [
      {
        expand:
          'operations,versionedRepresentations,editmeta,changelog,renderedFields,customfield_10908.properties',
        id: '51858',
        self:
          'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issue/51858',
        key: 'MKE-1389',
        fields: {
          customfield_11160: null,
          customfield_11161: null,
          customfield_11040: null,
          customfield_11042: null,
          customfield_11043: null,
          customfield_11045: null,
          customfield_10990: null,
          customfield_11046: null,
          customfield_10991: null,
          resolution: null,
          customfield_11047: null,
          customfield_11048: null,
          customfield_10993: null,
          customfield_11049: null,
          customfield_10510: null,
          customfield_10500: null,
          customfield_10984: null,
          customfield_11039: null,
          customfield_10621: null,
          customfield_10622: null,
          customfield_10985: null,
          customfield_10501: null,
          customfield_10986: null,
          customfield_10624: null,
          customfield_10987: null,
          customfield_10988: null,
          customfield_10625: null,
          customfield_10989: null,
          customfield_10626: null,
          customfield_10507: null,
          customfield_10628: null,
          customfield_10508: null,
          customfield_10509: null,
          lastViewed: '2019-12-04T11:21:01.482+0100',
          customfield_11150: null,
          customfield_11151: null,
          customfield_11030: null,
          customfield_11031: null,
          customfield_11152: null,
          customfield_11153: null,
          customfield_11032: null,
          customfield_11154: null,
          customfield_11033: null,
          customfield_11034: null,
          customfield_10980: null,
          customfield_11035: null,
          customfield_11156: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/customFieldOption/11089',
            value: 'To be checked',
            id: '11089'
          },
          customfield_11036: null,
          customfield_10981: null,
          customfield_10982: null,
          customfield_11158: null,
          labels: [],
          customfield_10983: null,
          customfield_11038: null,
          customfield_11028: null,
          customfield_11149: null,
          customfield_10610: null,
          customfield_11029: null,
          customfield_10974: null,
          customfield_10975: null,
          customfield_10977: null,
          customfield_10978: null,
          customfield_10979: null,
          customfield_10619: null,
          issuelinks: [],
          assignee: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/user?accountId=111111111111111111111111',
            name: 'dean.anderson',
            key: 'dean.anderson',
            accountId: '111111111111111111111111',
            emailAddress: 'dean.anderson@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/111111111111111111111111/11111111-1111-1111-1111-111111111113/128?size=32&s=32'
            },
            displayName: 'Dean Anderson',
            active: true,
            timeZone: 'Europe/Berlin',
            accountType: 'atlassian'
          },
          components: [
            {
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/component/10233',
              id: '10233',
              name: 'Apps',
              description:
                'https://github.com/contentful/user_interface/tree/master/src/javascripts/app/settings/apps'
            },
            {
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/component/10232',
              id: '10232',
              name: 'Marketplace',
              description: 'https://www.contentful.com/developers/marketplace/'
            }
          ],
          customfield_11140: null,
          customfield_11020: null,
          customfield_11021: null,
          customfield_11022: null,
          customfield_11143: null,
          customfield_11023: null,
          customfield_11144: null,
          customfield_11145: null,
          customfield_11024: null,
          customfield_11025: null,
          customfield_10970: null,
          customfield_11146: null,
          customfield_10971: null,
          customfield_11026: null,
          customfield_11147: null,
          customfield_11148: null,
          customfield_11027: null,
          customfield_10972: null,
          customfield_10962: null,
          customfield_11138: null,
          customfield_11017: null,
          customfield_11018: null,
          customfield_10963: null,
          customfield_10600: null,
          customfield_11139: null,
          customfield_10964: null,
          customfield_10601: null,
          customfield_10965: null,
          customfield_10602: null,
          customfield_10966: null,
          customfield_10967: null,
          customfield_10968: null,
          customfield_10605: null,
          customfield_10969: null,
          customfield_10606: null,
          customfield_10608: null,
          subtasks: [
            {
              id: '52188',
              key: 'MKE-1414',
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issue/52188',
              fields: {
                summary: 'Build front end app',
                status: {
                  self:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/status/10012',
                  description: '',
                  iconUrl:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/status_generic.gif',
                  name: 'In progress',
                  id: '10012',
                  statusCategory: {
                    self:
                      'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/statuscategory/4',
                    id: 4,
                    key: 'indeterminate',
                    colorName: 'yellow',
                    name: 'In Progress'
                  }
                },
                priority: {
                  self:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/priority/3',
                  iconUrl:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/priorities/medium.svg',
                  name: 'Medium',
                  id: '3'
                },
                issuetype: {
                  self:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issuetype/11206',
                  id: '11206',
                  description: 'The sub-task of the issue',
                  iconUrl:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/issuetypes/subtask_alternate.png',
                  name: 'Sub-task',
                  subtask: true
                }
              }
            },
            {
              id: '52192',
              key: 'MKE-1418',
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issue/52192',
              fields: {
                summary: 'Figure out if this needs to be done',
                status: {
                  self:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/status/10850',
                  description: '',
                  iconUrl:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/',
                  name: 'To Do',
                  id: '10850',
                  statusCategory: {
                    self:
                      'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/statuscategory/2',
                    id: 2,
                    key: 'new',
                    colorName: 'blue-gray',
                    name: 'To Do'
                  }
                },
                priority: {
                  self:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/priority/3',
                  iconUrl:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/priorities/medium.svg',
                  name: 'Medium',
                  id: '3'
                },
                issuetype: {
                  self:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issuetype/11206',
                  id: '11206',
                  description: 'The sub-task of the issue',
                  iconUrl:
                    'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/issuetypes/subtask_alternate.png',
                  name: 'Sub-task',
                  subtask: true
                }
              }
            }
          ],
          customfield_11130: null,
          customfield_11010: null,
          customfield_11131: null,
          customfield_11011: null,
          customfield_11132: null,
          reporter: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/user?accountId=557058%3A080f5211-c904-490c-8e55-93310f0f6e5b',
            name: 'julius.caesar',
            key: 'julius.caesar',
            accountId: '557058:080f5211-c904-490c-8e55-93310f0f6e5b',
            emailAddress: 'julius.caesar@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=32&s=32'
            },
            displayName: 'Julius Caesar',
            active: true,
            timeZone: 'Europe/Berlin',
            accountType: 'atlassian'
          },
          customfield_11133: null,
          customfield_11012: null,
          customfield_11134: null,
          customfield_11014: null,
          customfield_11135: null,
          customfield_10960: null,
          customfield_11015: null,
          customfield_11137: null,
          customfield_10961: null,
          customfield_11016: null,
          customfield_10951: null,
          customfield_11006: null,
          customfield_11127: null,
          customfield_11007: null,
          customfield_11128: null,
          customfield_10952: null,
          customfield_10953: null,
          customfield_11008: null,
          customfield_11129: null,
          customfield_10954: null,
          customfield_11009: null,
          customfield_10955: null,
          customfield_10956: null,
          customfield_10957: null,
          customfield_10958: null,
          customfield_10959: null,
          votes: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issue/MKE-1389/votes',
            votes: 0,
            hasVoted: false
          },
          issuetype: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issuetype/11204',
            id: '11204',
            description: 'A user story. Created by Jira Software - do not edit or delete.',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/viewavatar?size=medium&avatarId=10315&avatarType=issuetype',
            name: 'Story',
            subtask: false,
            avatarId: 10315
          },
          customfield_11120: null,
          project: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/project/10555',
            id: '10555',
            key: 'MKE',
            name: '[PRD] Team MKEensibility',
            projectTypeKey: 'software',
            simplified: false,
            avatarUrls: {
              '48x48':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?pid=10555&avatarId=10981',
              '24x24':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?size=small&s=small&pid=10555&avatarId=10981',
              '16x16':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?size=xsmall&s=xsmall&pid=10555&avatarId=10981',
              '32x32':
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/secure/projectavatar?size=medium&s=medium&pid=10555&avatarId=10981'
            },
            projectCategory: {
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/projectCategory/10002',
              id: '10002',
              description: '',
              name: 'Product Development'
            }
          },
          customfield_11000: null,
          customfield_11121: null,
          customfield_11122: null,
          customfield_11001: null,
          customfield_11123: null,
          customfield_11002: null,
          customfield_11124: null,
          customfield_11003: null,
          customfield_11125: null,
          customfield_11004: null,
          customfield_11005: null,
          customfield_11126: null,
          customfield_10941: null,
          customfield_11118: null,
          customfield_10943: null,
          customfield_10701: null,
          customfield_10944: null,
          customfield_10945: null,
          resolutiondate: null,
          customfield_10947: null,
          customfield_10948: null,
          customfield_10949: null,
          watches: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/issue/MKE-1389/watchers',
            watchCount: 1,
            isWatching: false
          },
          customfield_11111: null,
          customfield_11112: null,
          customfield_10137: null,
          customfield_10930: null,
          customfield_10138: null,
          customfield_10931: null,
          customfield_10139: null,
          customfield_10932: null,
          customfield_11109: null,
          customfield_10933: null,
          customfield_10934: null,
          customfield_10936: null,
          customfield_10937: null,
          customfield_10938: null,
          customfield_10939: null,
          updated: '2019-11-25T13:41:53.790+0100',
          description:
            '* convert hacky KEYt code to app\n* refine UX so it works with Martin\n* create installation / uninstallation screens\n* make the companion app required but installed manually\n* stretch: try to get companion to marketplace\n\n',
          customfield_10130: null,
          customfield_10131: null,
          customfield_10132: null,
          customfield_10133: null,
          customfield_10134: null,
          customfield_10135: null,
          customfield_10136: null,
          customfield_10127: null,
          customfield_10006: 'MKE-933',
          customfield_10007: {
            hasEpicLinkFieldDependency: false,
            showField: false,
            nonEditableReason: {
              reason: 'PLUGIN_LICENSE_ERROR',
              message: 'Portfolio for Jira must be licensed for the Parent Link to be available.'
            }
          },
          customfield_10128: null,
          customfield_10920: null,
          customfield_10129: null,
          customfield_10921: null,
          customfield_10922: null,
          customfield_10923: null,
          customfield_10924: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/customFieldOption/10622',
            value: 'TODO',
            id: '10622'
          },
          customfield_10925: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/customFieldOption/10625',
            value: 'TODO',
            id: '10625'
          },
          customfield_10926: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/customFieldOption/10627',
            value: 'TODO',
            id: '10627'
          },
          customfield_10927: null,
          customfield_10928: null,
          customfield_10929: null,
          summary: 'Jira app for Contentful',
          customfield_10000: '{}',
          customfield_10121: null,
          customfield_10001: null,
          customfield_10122: null,
          customfield_10123: null,
          customfield_10002: null,
          customfield_10124: null,
          customfield_10125: null,
          customfield_10117: [
            'com.atlassian.greenhopper.service.sprint.Sprint@5ca16bb6[id=581,rapidViewId=38,state=ACTIVE,name=Team MKEensibility Sprint 41,goal=,startDate=2019-11-25T12:23:56.930Z,endDate=2019-12-09T12:23:00.000Z,completeDate=<null>,sequence=581]'
          ],
          environment: null,
          customfield_10118: '0|i05wjo:2',
          customfield_10912: null,
          customfield_10913: null,
          duedate: null,
          customfield_10914: null,
          customfield_10915: 13.0,
          customfield_10916: null,
          customfield_10918: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/customFieldOption/10615',
            value: 'Yes',
            id: '10615'
          },
          customfield_10919: null,
          statuscategorychangedate: '2019-11-25T13:41:53.790+0100',
          fixVersions: [],
          customfield_10104: [],
          customfield_10105: null,
          customfield_10106: null,
          customfield_10900: null,
          customfield_10908: null,
          priority: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/priority/3',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/priorities/medium.svg',
            name: 'Medium',
            id: '3'
          },
          customfield_10102: null,
          customfield_10103: null,
          versions: [],
          status: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/status/10012',
            description: '',
            iconUrl:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/images/icons/status_generic.gif',
            name: 'In progress',
            id: '10012',
            statusCategory: {
              self:
                'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/statuscategory/4',
              id: 4,
              key: 'indeterminate',
              colorName: 'yellow',
              name: 'In Progress'
            }
          },
          customfield_11090: null,
          customfield_11091: null,
          creator: {
            self:
              'https://api.atlassian.com/ex/jira/11111111-1111-1111-1111-111111111112/rest/api/2/user?accountId=557058%3A080f5211-c904-490c-8e55-93310f0f6e5b',
            name: 'julius.caesar',
            key: 'julius.caesar',
            accountId: '557058:080f5211-c904-490c-8e55-93310f0f6e5b',
            emailAddress: 'julius.caesar@example.com',
            avatarUrls: {
              '48x48':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=48&s=48',
              '24x24':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=24&s=24',
              '16x16':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=16&s=16',
              '32x32':
                'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:080f5211-c904-490c-8e55-93310f0f6e5b/59db14a4-6138-4822-9a70-7c17a87cb394/128?size=32&s=32'
            },
            displayName: 'Julius Caesar',
            active: true,
            timeZone: 'Europe/Berlin',
            accountType: 'atlassian'
          },
          customfield_11092: null,
          customfield_11093: null,
          customfield_11094: null,
          customfield_11095: null,
          customfield_11096: null,
          customfield_11097: null,
          customfield_11080: null,
          customfield_11081: null,
          customfield_11082: null,
          customfield_11083: null,
          customfield_11086: null,
          customfield_11087: null,
          customfield_11088: null,
          customfield_11089: null,
          workratio: -1,
          customfield_11190: null,
          customfield_11191: null,
          customfield_11192: null,
          customfield_11193: null,
          customfield_11072: null,
          created: '2019-11-19T10:48:15.298+0100',
          customfield_11073: null,
          customfield_11194: null,
          customfield_11074: null,
          customfield_11195: null,
          customfield_11075: null,
          customfield_11196: null,
          customfield_11076: null,
          customfield_11077: null,
          customfield_11078: null,
          customfield_11079: null,
          customfield_10300: null,
          customfield_10301: null,
          customfield_10534: null,
          customfield_10537: null,
          customfield_10538: null,
          customfield_11180: null,
          customfield_11181: null,
          customfield_11060: null,
          customfield_11062: null,
          customfield_11183: null,
          customfield_11064: null,
          customfield_11186: null,
          customfield_11066: null,
          customfield_11187: null,
          customfield_11188: null,
          customfield_11189: null,
          customfield_10530: null,
          customfield_10531: null,
          security: null,
          customfield_10525: null,
          customfield_10527: null,
          customfield_10528: null,
          customfield_11170: null,
          customfield_11171: null,
          customfield_11051: null,
          customfield_11052: null,
          customfield_11173: [],
          customfield_11053: null,
          customfield_11174: null,
          customfield_11054: null,
          customfield_11176: null,
          customfield_11055: null,
          customfield_11177: null,
          customfield_11178: null,
          customfield_11057: null,
          customfield_11179: null,
          customfield_11058: null,
          customfield_11059: null,
          customfield_10400: null,
          customfield_10521: null,
          customfield_10995: null,
          customfield_10511: null,
          customfield_10512: null,
          customfield_10996: null,
          customfield_10513: null,
          customfield_10997: null,
          customfield_10514: null,
          customfield_10998: null,
          customfield_10999: null,
          customfield_10515: null,
          customfield_10516: null,
          customfield_10517: null
        }
      }
    ]
  }
);

fetchMock.put(
  'https://api.atlassian.com/ex/jira/cloud-id/rest/api/2/issue/MKE-1389/properties/contentfulLink',
  200
);
