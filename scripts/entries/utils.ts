import contentful from 'contentful-management';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { Interface, createInterface } from 'readline';

export function validateEnvironment(): void {
  const { CONTENTFUL_ACCESS_TOKEN, SPACE_ID, ENVIRONMENT_ID } = process.env;

  if (!CONTENTFUL_ACCESS_TOKEN || !SPACE_ID || !ENVIRONMENT_ID) {
    console.error(
      'Missing required environment variables. Please set CONTENTFUL_ACCESS_TOKEN, SPACE_ID, and ENVIRONMENT_ID'
    );
    throw new Error('Missing required environment variables');
  }
}

export function createContentfulClient() {
  const { CONTENTFUL_ACCESS_TOKEN, SPACE_ID, ENVIRONMENT_ID } = process.env;

  return contentful.createClient(
    {
      accessToken: CONTENTFUL_ACCESS_TOKEN!,
    },
    {
      type: 'plain',
      defaults: {
        spaceId: SPACE_ID!,
        environmentId: ENVIRONMENT_ID!,
      },
    }
  );
}

export function createReadlineInterface(): Interface {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function askQuestion(rl: Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function getContentTypeIdByName(
  client: any,
  contentTypeName: string
): Promise<string | null> {
  try {
    const contentTypes = await client.contentType.getMany({});

    const contentType = contentTypes.items.find(
      (ct: any) => ct.name.toLowerCase() === contentTypeName.toLowerCase()
    );

    if (contentType) {
      return contentType.sys.id;
    }

    console.log('\n❌ Content type not found. Available content types:');
    contentTypes.items.forEach((ct: any) => {
      console.log(`   • ${ct.name} (ID: ${ct.sys.id})`);
    });

    return null;
  } catch (error) {
    console.error('❌ Error fetching content types:', error);
    return null;
  }
}

export async function getEntriesByContentType(
  client: PlainClientAPI,
  contentTypeId: string
): Promise<EntryProps[]> {
  try {
    const response = await client.entry.getMany({
      query: {
        content_type: contentTypeId,
        limit: 1000,
      },
    });

    console.log(`   📊 Found ${response.items.length} entries for this content type`);
    return response.items;
  } catch (error) {
    console.error('❌ Error fetching entries:', error);
    return [];
  }
}

export async function askForEntryCount(rl: Interface): Promise<number> {
  const entriesInput = await askQuestion(rl, 'Enter the number of entries to create: ');
  const numberOfEntries = Number.parseInt(entriesInput);

  if (isNaN(numberOfEntries) || numberOfEntries <= 0) {
    console.log('❌ Please enter a valid positive number.');
    throw new Error('Invalid entry count');
  }

  return numberOfEntries;
}

export async function askForContentTypeName(
  rl: Interface,
  deleteContentTypeName: string | undefined
): Promise<string> {
  let contentTypeName: string | undefined;

  if (deleteContentTypeName) {
    contentTypeName = deleteContentTypeName;
  } else {
    contentTypeName = await askQuestion(rl, 'Enter the name of the content type: ');
  }

  if (!contentTypeName) {
    console.log('❌ Content type name cannot be empty.');
    throw new Error('Empty content type name');
  }

  return contentTypeName;
}

export async function askForContentTypeId(
  rl: Interface,
  deleteContentTypeId: string | undefined
): Promise<string> {
  let contentTypeId: string | undefined;

  if (deleteContentTypeId) {
    contentTypeId = deleteContentTypeId;
  } else {
    contentTypeId = await askQuestion(rl, 'Enter the ID of the content type: ');
  }

  if (!contentTypeId) {
    console.log('❌ Content type ID cannot be empty.');
    throw new Error('Empty content type ID');
  }

  return contentTypeId;
}

export async function confirmAction(rl: Interface, prompt: string): Promise<boolean> {
  const answer = await askQuestion(rl, prompt);
  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}
