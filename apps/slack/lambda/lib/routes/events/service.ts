import { EventEntity, ResolvedEntity, SlackAppEventKey, SlackNotification } from './types';
import { NotFoundException } from '../../errors';
import { ContentTypeProps, EntryProps, PlainClientAPI } from 'contentful-management';
import { Block, KnownBlock } from '@slack/web-api';
import { makeSpaceEnvClient } from '../../clients/cma';
import { AuthTokenRepository } from '../auth-token';
import { MessagesRepository } from '../messages';
import { EVENT_TEXT_MAP, MESSAGE_EMOJI_MAP } from './constants';
import { getInstallationParametersFromCma } from '../../helpers/getInstallationParameters';

export class EventsService {
  constructor(
    private readonly acceptedEvents: SlackAppEventKey[],
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly messagesRepository: MessagesRepository,
    private makeCmaClient: typeof makeSpaceEnvClient,
  ) {
    this.acceptedEvents = acceptedEvents;
  }

  private getEntryName = async (
    cmaClient: PlainClientAPI,
    entry: EntryProps,
    contentType: ContentTypeProps,
  ): Promise<string | undefined> => {
    try {
      const locales = await cmaClient.locale.getMany({});
      const defaultLocale = locales.items.find((locale) => locale.default);
      const defaultLocaleCode = defaultLocale?.code || 'en-US';
      const displayField: Record<string, string> = entry?.fields[contentType.displayField];
      let entryName: string | undefined = displayField[defaultLocaleCode];
      if (!entryName) {
        // if default locale has not value, find the first locale with value
        entryName = Object.values(displayField).find((value) => !!value);
      }
      return entryName;
    } catch (e) {
      return undefined;
    }
  };

  convertToEventKey(topic?: string): SlackAppEventKey | undefined {
    if (!topic) {
      throw new NotFoundException({ errMessage: 'Event topic not found' });
    }
    const eventArr = topic.split('.');
    if (eventArr.length > 0) {
      const eventKey = eventArr[eventArr.length - 1] as SlackAppEventKey;
      if (!this.acceptedEvents.includes(eventKey)) {
        return undefined;
      }

      return eventKey;
    }
  }

  async getInstallationParameters(spaceId: string, environmentId: string) {
    const installationParameters = await getInstallationParametersFromCma(spaceId, environmentId);
    if (!installationParameters?.notifications || installationParameters.notifications.length < 1) {
      return null;
    }

    if (!installationParameters.workspaces || installationParameters.workspaces.length < 1) {
      // no workspace connected
      throw new NotFoundException({
        errMessage: 'Workspaces not found in installation parameters',
        environmentId,
        spaceId,
      });
    }
    return installationParameters;
  }

  async sendMessagesForNotifications(
    notifications: SlackNotification[],
    eventKey: SlackAppEventKey,
    workspaceId: string,
    eventBody: EventEntity,
  ) {
    const spaceId = eventBody.sys.space.sys.id;
    const environmentId = eventBody.sys.environment.sys.id;

    const [{ token }, resolvedEntity] = await Promise.all([
      this.authTokenRepository.get(workspaceId, {
        spaceId,
        environmentId,
      }),
      this.getResolvedEntity(spaceId, environmentId, eventKey, eventBody),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
    const promises = notifications!.reduce((acc: Promise<any>[], notification) => {
      const { selectedEvent, selectedContentType, selectedChannel } = notification;

      if (
        selectedEvent[eventKey] &&
        selectedContentType === eventBody.sys.contentType.sys.id &&
        selectedChannel
      ) {
        acc.push(
          this.messagesRepository.create(token, selectedChannel, {
            blocks: this.createMessageBlocks(eventKey, eventBody, resolvedEntity),
          }),
        );
      }
      return acc;
    }, []);

    await Promise.all(promises);
  }

  async getResolvedEntity(
    spaceId: string,
    environmentId: string,
    event: SlackAppEventKey,
    eventBody: EventEntity,
  ): Promise<ResolvedEntity | undefined> {
    let actorId: undefined | string;
    let date: undefined | string;
    let entryName: undefined | string;
    let entry: undefined | EntryProps;

    const cmaClient = await this.makeCmaClient(spaceId, environmentId);

    const contentType = await cmaClient.contentType.get({
      contentTypeId: eventBody.sys.contentType.sys.id,
    });

    if (event !== SlackAppEventKey.DELETED) {
      entry = await cmaClient.entry.get({ entryId: eventBody.sys.id });
    }

    switch (event) {
      case SlackAppEventKey.CREATED: {
        actorId = eventBody?.sys.createdBy?.sys.id;
        date = eventBody?.sys.createdAt
          ? new Date(eventBody?.sys.createdAt).toDateString()
          : undefined;
        break;
      }

      case SlackAppEventKey.PUBLISH: {
        actorId = entry?.sys.publishedBy?.sys.id;
        date = entry?.sys.publishedAt ? new Date(entry?.sys.publishedAt).toDateString() : undefined;
        if (entry) {
          entryName = await this.getEntryName(cmaClient, entry, contentType);
        }
        break;
      }

      case SlackAppEventKey.DELETED: {
        actorId = eventBody.sys.deletedBy?.sys.id;
        date = eventBody.sys.deletedAt
          ? new Date(eventBody.sys.deletedAt).toDateString()
          : undefined;
        break;
      }

      case SlackAppEventKey.UNPUBLISHED: {
        if (entry) {
          entryName = await this.getEntryName(cmaClient, entry, contentType);
        }
        date = eventBody?.sys.createdAt
          ? new Date(eventBody?.sys.createdAt).toDateString()
          : undefined;
        break;
      }
    }

    return {
      actorId,
      entryName: entryName,
      date,
      entity: entry,
    };
  }

  createMessageBlocks(event: SlackAppEventKey, entry: EntryProps, resolvedEntity?: ResolvedEntity) {
    const blocks: (Block | KnownBlock)[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${MESSAGE_EMOJI_MAP[event]} An entry was ${EVENT_TEXT_MAP[event]}!*`,
        },
      },
    ];

    if (resolvedEntity?.entryName) {
      blocks.push({
        type: 'divider',
      });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `> *<https://app.contentful.com/spaces/${entry.sys.space.sys.id}/environments/${entry.sys.environment.sys.id}/entries/${entry.sys.id}|${resolvedEntity?.entryName}>*`,
        },
      });
    }

    if (resolvedEntity?.date) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${entry.sys.contentType.sys.id} | ${resolvedEntity.date || 'A while ago'}`,
          },
        ],
      });
    }
    blocks.push({
      type: 'divider',
    });
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Open in Contentful',
            emoji: true,
          },
          url: `https://app.contentful.com/spaces/${entry.sys.space.sys.id}/environments/${entry.sys.environment.sys.id}/entries/${entry.sys.id}`,
        },
      ],
    });

    return blocks;
  }
}
