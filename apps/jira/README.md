Jira App
===

## Local Development

In order to develop locally Jira App you need to run locally both the Contentful Application,
and the Lambda function which handles 
[Atlassian's OAuth Flow](https://developer.atlassian.com/server/jira/platform/oauth/).

Technologies involved are:
* [serverless](https://github.com/serverless/serverless)
To run the Lambda function on your machine by means of the [offline plugin](https://github.com/dherault/serverless-offline)
* [ngrok](https://ngrok.com/)
To create a public URL to be used as OAUTH URI


### Launching the script

Launching the application locally namely means

```
npm run dev
```

This script expects the following environment variables to be set

| Variable                      | Description                                                               |
| ---                           | ---                                                                       |
| `ATLASSIAN_APP_CLIENT_ID`     | Client Id of the Atlassian Application you will use for local development |
| `ATLASSIAN_APP_CLIENT_SECRET` | Client Secret of the same Atlassian Application                           |