import assert from 'node:assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createContentfulClient, createReadlineInterface, askQuestion } from '../entries/utils';

// Load environment variables from .env file in scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const EVENT_TOPICS_PROMPT =
  'Enter event topics (e.g. Entry.save,Entry.auto_save,Entry.delete,AppInstallation.delete): ';

function parseTopics(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

export const createAppEventSubscription = async () => {
  const {
    CONTENTFUL_ORG_ID: organizationId = '',
    CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
    CONTENTFUL_ACCESS_TOKEN: accessToken = '',
    CONTENTFUL_FUNCTION_ID: functionId = '',
    CONTENTFUL_EVENT_TOPICS: envTopics = '',
  } = process.env;

  assert.ok(organizationId !== '', `CONTENTFUL_ORG_ID environment variable must be defined`);
  assert.ok(appDefinitionId !== '', `CONTENTFUL_APP_DEF_ID environment variable must be defined`);
  assert.ok(accessToken !== '', `CONTENTFUL_ACCESS_TOKEN environment variable must be defined`);

  let topics: string[];
  if (envTopics.trim() !== '') {
    topics = parseTopics(envTopics);
    if (topics.length === 0) {
      console.error(
        '❌ CONTENTFUL_EVENT_TOPICS could not be parsed. At least one event topic is required.'
      );
      return;
    }
  } else {
    const rl = createReadlineInterface();
    try {
      const answer = await askQuestion(rl, EVENT_TOPICS_PROMPT);
      topics = parseTopics(answer);
      if (topics.length === 0) {
        console.error('❌ At least one event topic is required.');
        return;
      }
    } finally {
      rl.close();
    }
  }

  const client = createContentfulClient();

  try {
    const eventSubscription = await client.appEventSubscription.upsert(
      {
        organizationId,
        appDefinitionId,
      },
      {
        topics,
        functions: {
          handler: {
            sys: {
              type: 'Link',
              linkType: 'Function',
              id: functionId,
            },
          },
        },
      }
    );

    console.log('Subscription to events successfully created');
    console.dir(eventSubscription, { depth: 5 });
  } catch (error) {
    console.error(error);
  }
};

// This is needed for testing purposes
// We only want to run the script if it is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppEventSubscription();
}
