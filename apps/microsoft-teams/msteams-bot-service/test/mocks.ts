import sinon from 'sinon';
import { BotBuilderCloudAdapter } from '@microsoft/teamsfx';
import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
import { Request, Response } from 'botbuilder';
import { Response as ExpressResponse } from 'express';

export const makeMockConversationBot = (): sinon.SinonStubbedInstance<ConversationBot> => {
  const stubbedBot = sinon.stub(
    new ConversationBot({
      adapterConfig: {
        MicrosoftAppId: 'microsoft-app-id',
        MicrosoftAppPassword: 'microsfot-app-password',
        MicrosoftAppType: 'MultiTenant',
      },
      notification: {
        enabled: true,
      },
    })
  );
  stubbedBot.requestHandler.callsFake(async (_request: Request, response: Response) => {
    // the bot request handler is responsible for sending along a result, we will
    // just mock that behavior here to ensure our mock actually finishes the response
    (response as ExpressResponse).status(200).send();
  });
  return stubbedBot;
};

export const installationUpdateAdd = {
  action: 'add',
  type: 'installationUpdate',
  timestamp: '2023-11-08T23:12:53.312Z',
  id: 'f:0227379d-c0f9-166b-db7e-b05b78683ac6',
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/amer/',
  from: {
    id: '29:1LiU1MMak9SGFDjuzr4H08D6Xg1OYyjele5YRWI8ytVTzXHOO2rEHW9Xf8PetZELUm0hv2iwXGEWy6cu7kDNawQ',
    aadObjectId: 'b847937f-d0a7-477f-bb88-1792bb5da1e7',
  },
  conversation: {
    isGroup: true,
    conversationType: 'channel',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
  },
  recipient: {
    id: '28:123761fc-f4e6-4f5d-ad9e-e1b4d1690297',
    name: 'Contentful  development ',
  },
  entities: [
    {
      locale: 'en-GB',
      type: 'clientInfo',
    },
  ],
  channelData: {
    settings: {
      selectedChannel: {
        id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
      },
    },
    channel: {
      id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
    },
    team: {
      aadGroupId: '1d261205-9d54-4c6d-8c3b-45468ed6fabe',
      name: 'Digital Initiative Public Relations',
      id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
    },
    tenant: {
      id: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    },
    source: {
      name: 'message',
    },
  },
  locale: 'en-GB',
};

export const conversationUpdateMembersAdded = {
  membersAdded: [
    {
      id: '28:123761fc-f4e6-4f5d-ad9e-e1b4d1690297',
    },
  ],
  type: 'conversationUpdate',
  timestamp: '2023-11-08T23:12:53.312Z',
  id: 'f:19d44585-510d-7c0b-c051-a460674ccccd',
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/amer/',
  from: {
    id: '29:1LiU1MMak9SGFDjuzr4H08D6Xg1OYyjele5YRWI8ytVTzXHOO2rEHW9Xf8PetZELUm0hv2iwXGEWy6cu7kDNawQ',
    aadObjectId: 'b847937f-d0a7-477f-bb88-1792bb5da1e7',
  },
  conversation: {
    isGroup: true,
    conversationType: 'channel',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
  },
  recipient: {
    id: '28:123761fc-f4e6-4f5d-ad9e-e1b4d1690297',
    name: 'Contentful  development ',
  },
  channelData: {
    team: {
      aadGroupId: '1d261205-9d54-4c6d-8c3b-45468ed6fabe',
      name: 'Digital Initiative Public Relations',
      id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
    },
    eventType: 'teamMemberAdded',
    tenant: {
      id: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    },
    settings: {
      selectedChannel: {
        id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
      },
    },
  },
};

export const installationUpdateRemove = {
  action: 'remove',
  type: 'installationUpdate',
  timestamp: '2023-11-08T23:18:27.805Z',
  id: 'f:3d610693-b04c-57b4-b66e-c5915592de91',
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/amer/',
  from: {
    id: '29:1LiU1MMak9SGFDjuzr4H08D6Xg1OYyjele5YRWI8ytVTzXHOO2rEHW9Xf8PetZELUm0hv2iwXGEWy6cu7kDNawQ',
    aadObjectId: 'b847937f-d0a7-477f-bb88-1792bb5da1e7',
  },
  conversation: {
    isGroup: true,
    conversationType: 'channel',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
  },
  recipient: {
    id: '28:123761fc-f4e6-4f5d-ad9e-e1b4d1690297',
    name: 'Contentful  development ',
  },
  entities: [
    {
      locale: 'en-GB',
      type: 'clientInfo',
    },
  ],
  channelData: {
    settings: {
      selectedChannel: {
        id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
      },
    },
    channel: {
      id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
    },
    team: {
      aadGroupId: '1d261205-9d54-4c6d-8c3b-45468ed6fabe',
      name: 'Digital Initiative Public Relations',
      id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
    },
    tenant: {
      id: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    },
    source: {
      name: 'message',
    },
  },
  locale: 'en-GB',
};

export const converationUpdateMembersRemoved = {
  membersRemoved: [
    {
      id: '28:123761fc-f4e6-4f5d-ad9e-e1b4d1690297',
    },
  ],
  type: 'conversationUpdate',
  timestamp: '2023-11-08T23:18:26.9085244Z',
  id: 'f:01c20d42-cbfb-a44a-b367-b82ab7723829',
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/amer/',
  from: {
    id: '29:1LiU1MMak9SGFDjuzr4H08D6Xg1OYyjele5YRWI8ytVTzXHOO2rEHW9Xf8PetZELUm0hv2iwXGEWy6cu7kDNawQ',
    aadObjectId: 'b847937f-d0a7-477f-bb88-1792bb5da1e7',
  },
  conversation: {
    isGroup: true,
    conversationType: 'channel',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
  },
  recipient: {
    id: '28:123761fc-f4e6-4f5d-ad9e-e1b4d1690297',
    name: 'Contentful  development ',
  },
  channelData: {
    team: {
      aadGroupId: '1d261205-9d54-4c6d-8c3b-45468ed6fabe',
      name: 'Digital Initiative Public Relations',
      id: '19:5bb095d8a12544bcada3d6f03f943e69@thread.tacv2',
    },
    eventType: 'teamMemberRemoved',
    tenant: {
      id: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    },
  },
};
