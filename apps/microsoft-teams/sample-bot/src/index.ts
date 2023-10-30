import { AdaptiveCards } from '@microsoft/adaptivecards-tools';
import * as restify from 'restify';
// import notificationTemplate from "./adaptiveCards/notification-default.json";
import contentfulTemplate from './adaptiveCards/contentful-default.json';
import { notificationApp } from './internal/initialize';
import { CardData } from './cardModels';
import { TeamsBot } from './teamsBot';

// Create HTTP server using restify
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nApp Started, ${server.name} listening to ${server.url}`);
});

// Register an API endpoint with `restify`.
//
// This endpoint is provided by your application to listen to events. You can configure
// your IT processes, other applications, background tasks, etc - to POST events to this
// endpoint.
//
// In response to events, this function sends Adaptive Cards to Teams. You can update the logic in this function
// to suit your needs. You can enrich the event with additional data and send an Adaptive Card as required.
//
// You can add authentication / authorization for this API. Refer to
// https://aka.ms/teamsfx-notification for more details.
server.post(
  '/api/notification',
  restify.plugins.queryParser(),
  restify.plugins.bodyParser(), // Add more parsers if needed
  async (req, res) => {
    // By default this function will iterate all the installation points and send an Adaptive Card
    // to every installation.
    const pageSize = 100;
    let continuationToken: string | undefined = undefined;
    do {
      const pagedData = await notificationApp.notification.getPagedInstallations(
        pageSize,
        continuationToken
      );
      const installations = pagedData.data;
      continuationToken = pagedData.continuationToken;

      for (const target of installations) {
        if (target.type === 'Channel') {
          // If you send an Adaptive Card to the Team (the target), it sends it to the `General` channel of the Team
          await target.sendAdaptiveCard(
            AdaptiveCards.declare<CardData>(contentfulTemplate).render({
              title: 'An entry, Managing Messages was created',
              appName: 'Contentful',
              creator: 'Lisa White',
              entry: 'Managing Messages',
              contentType: 'Doc page',
              space: 'Globex Docs',
              createdDate: 'Fri Sep 1, 2023 at 12:00pm',
              notificationUrl: 'https://app.contentful.com',
            })
          );
        }

        // This was the original notification template
        // await target.sendAdaptiveCard(
        //   AdaptiveCards.declare<CardData>(notificationTemplate).render({
        //     title: "New Event Occurred!",
        //     appName: "Contoso App Notification",
        //     description: `This is a sample http-triggered notification to ${target.type}`,
        //     notificationUrl: "https://aka.ms/teamsfx-notification-new",
        //   })
        // );
      }
    } while (continuationToken);

    res.json({});
  }
);

// Register an API endpoint with `restify`. Teams sends messages to your application
// through this endpoint.
//
// The Teams Toolkit bot registration configures the bot with `/api/messages` as the
// Bot Framework endpoint. If you customize this route, update the Bot registration
// in `/templates/provision/bot.bicep`.
const teamsBot = new TeamsBot();
server.post('/api/messages', async (req, res) => {
  await notificationApp.requestHandler(req, res, async (context) => {
    await teamsBot.run(context);
  });
});
