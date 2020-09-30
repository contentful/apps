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

Parameters below can be retrieved from Atlassian Developer WebApp after setting 
up an Atlassian Application (see following section).

### Setting up an Atlassian Application

* Login into your Atlassian Developer account
* Go [to the apps view](https://developer.atlassian.com/apps)
* Create a new app
[![Screen-Shot-2020-09-30-at-14-51-16.png](https://i.postimg.cc/1zyybQLn/Screen-Shot-2020-09-30-at-14-51-16.png)](https://postimg.cc/K1sXgdcx)
* Add `Jira platform REST API` 
* Enable all the permissions (this is going to be only local, so doesn't matter)
* Click on `OAuth 2.0 (3LO)`
[![Screen-Shot-2020-09-30-at-14-52-55.png](https://i.postimg.cc/8Ph5YtjY/Screen-Shot-2020-09-30-at-14-52-55.png)](https://postimg.cc/qzv4hccc)
* Paste the Lamba URL you get when you launch development script
[![Screen-Shot-2020-09-30-at-14-55-16.png](https://i.postimg.cc/zX1DTK0F/Screen-Shot-2020-09-30-at-14-55-16.png)](https://postimg.cc/BtMG0LWj)
in the Callback URL
[![Screen-Shot-2020-09-30-at-14-56-29.png](https://i.postimg.cc/rwwk9JWx/Screen-Shot-2020-09-30-at-14-56-29.png)](https://postimg.cc/ZC22b6w5)

### Caveats
* Everytime you restart the development script it regenerates the Ngrok URL, so you need to 
redo last step of the list above