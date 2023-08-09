import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

import { makeSlackClient, makeSingleTableClient, makeDynamoDocumentClient } from './clients';

import { errorMiddleware } from './errors';
import { config } from './config';
import { corsConfig } from './middlewares/corsConfig';

import { AuthTokenController, AuthTokenRepository } from './routes/auth-token';
import { WorkspacesController, WorkspacesRepository } from './routes/workspaces';
import {
  createContentfulRequestVerificationMiddleware,
  createServerlessMiddleware,
} from './middlewares';
import { createSlackEventsMiddleware } from './routes/slack-events';
import { MessagesController, MessagesRepository } from './routes/messages';
import { EventsController, EventsService } from './routes/events';
import { ACCEPTED_EVENTS } from './routes/events/constants';
import { makeSpaceEnvClient } from './clients/cma';
import { ActionsController } from './routes/actions';

export function bootstrap(): serverless.Application {
  const app = express();

  app.use(cors(corsConfig));

  const slackClient = makeSlackClient(config.slack, config.backendUrl);
  const dynamoDocumentClient = makeDynamoDocumentClient(config.dynamo);
  const singleTableClient = makeSingleTableClient(config.dynamo.tableName, dynamoDocumentClient);

  const authTokenRepository = new AuthTokenRepository(singleTableClient, slackClient);
  const workspacesRepository = new WorkspacesRepository(slackClient);
  const messagesRepository = new MessagesRepository(slackClient);

  const authToken = new AuthTokenController(authTokenRepository, config.frontendUrl);
  const workspaces = new WorkspacesController(authTokenRepository, workspacesRepository);

  const messages = new MessagesController(authTokenRepository, messagesRepository);

  const actions = new ActionsController();

  const eventsService = new EventsService(
    ACCEPTED_EVENTS,
    authTokenRepository,
    messagesRepository,
    makeSpaceEnvClient
  );

  const events = new EventsController(eventsService);

  app.use(createServerlessMiddleware(config.serverless));
  app.use(
    ['/api/messages', '/api/spaces/*', '/api/events', 'api/tokens'],
    createContentfulRequestVerificationMiddleware(config.signingSecret)
  );
  app.use('/api/slack-events', createSlackEventsMiddleware(config.slack, authTokenRepository));
  app.use(
    express.json({
      type: ['application/json', 'application/vnd.contentful.management.v1+json'],
    })
  );

  app.get('/api/oauth', authToken.get);
  app.post('/api/tokens', authToken.post);
  app.post('/api/empty', (req, res) => res.sendStatus(200));
  app.get(
    '/api/spaces/:spaceId/environments/:environmentId/workspaces/:workspaceId',
    workspaces.get
  );
  app.get(
    '/api/spaces/:spaceId/environments/:environmentId/workspaces/:workspaceId/channels',
    workspaces.getChannels
  );
  app.get(
    '/api/spaces/:spaceId/environments/:environmentId/workspaces/:workspaceId/channel/:channelId',
    workspaces.getChannel
  );
  app.get('/api/spaces/:spaceId/environments/:environmentId/channels', workspaces.getChannels);
  app.post('/api/messages', messages.post);
  app.post('/api/events', events.post);
  app.post('/api/actions', actions.post);

  app.use(errorMiddleware);

  return app;
}
