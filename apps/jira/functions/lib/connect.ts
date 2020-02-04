import { getEnvVarOrThrow } from './helpers'
import { HTTPResponse } from './lambda'

export const getConnectJson = (baseUrl: string): any => ({
  key: 'contentful',
  name: 'Contentful',
  description: 'Link Contentful entries to Jira issues.',
  vendor: {
    name: 'Contentful',
    url: 'https://www.contentful.com'
  },
  baseUrl,
  links: {
    self: `${baseUrl}/connect.json`,
    homepage: `${baseUrl}/connect.json`
  },
  authentication: {
    type: 'none'
  },
  scopes: ['READ', 'WRITE'],
  modules: {
    jiraEntityProperties: [
      {
        key: 'jira-issue-contentful-records-link',
        name: {
          value: 'Contentful records',
          i18n: 'contentful.records'
        },
        entityType: 'issue',
        keyConfigurations: [
          {
            propertyKey: 'contentfulLink',
            extractions: [
              {
                objectName: 'records',
                type: 'string',
                alias: 'contentfulRecord'
              }
            ]
          }
        ]
      }
    ]
  },
  apiMigrations: {
    gdpr: true
  }
})

export const handleConnectLambdaEvent = async (): Promise<HTTPResponse> =>
  Promise.resolve({
    statusCode: 200,
    body: getConnectJson(getEnvVarOrThrow('BASE_URL'))
  })
