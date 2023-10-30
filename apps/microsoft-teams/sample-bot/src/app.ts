import { AdaptiveCards } from '@microsoft/adaptivecards-tools';
import contentfulTemplate from './adaptiveCards/contentful-default.json';
import { notificationApp } from './internal/initialize';
import { CardData } from './cardModels';
import { TeamsBot } from './teamsBot';
import express from 'express';
import { NotificationTargetType } from '@microsoft/teamsfx';

// Create HTTP server using express
const express = require('express');
const app = express();
const port = process.env.port || process.env.PORT || 3978;

app.listen(port, () => {
  console.log(`\nApp Started, listening on port ${port}`);
});

app.post('/api/notification', async (req, res) => {
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
      if (target.type === NotificationTargetType.Channel) {
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
    }
  } while (continuationToken);

  res.json({});
});

// Register an API endpoint with `restify`. Teams sends messages to your application
// through this endpoint.
//
// The Teams Toolkit bot registration configures the bot with `/api/messages` as the
// Bot Framework endpoint. If you customize this route, update the Bot registration
// in `/templates/provision/bot.bicep`.
const teamsBot = new TeamsBot();
app.post('/api/messages', async (req, res) => {
  await notificationApp.requestHandler(req, res, async (context) => {
    await teamsBot.run(context);
  });
});
