import * as contentful from 'contentful-management';
import * as readline from 'readline';

const { SPACE_ID, ENVIRONMENT_ID, CONTENTFUL_ACCESS_TOKEN } = process.env;

export function validateEnvironment(): void {
  if (!CONTENTFUL_ACCESS_TOKEN || !SPACE_ID || !ENVIRONMENT_ID) {
    console.error(
      'Missing required environment variables. Please set CONTENTFUL_ACCESS_TOKEN, SPACE_ID, and ENVIRONMENT_ID'
    );
    throw new Error('Missing required environment variables');
  }
}

export function createContentfulClient() {
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

export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function askQuestion(rl: readline.Interface, question: string): Promise<string> {
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

export async function getEntriesByContentType(client: any, contentTypeId: string): Promise<any[]> {
  try {
    console.log(`   📄 Fetching all entries for content type: ${contentTypeId}...`);

    const response = await client.entry.getMany({
      content_type: contentTypeId,
    } as any);

    console.log(`   📊 Got ${response.items.length} entries for this content type`);
    return response.items;
  } catch (error) {
    console.error('❌ Error fetching entries:', error);
    return [];
  }
}

export async function askForEntryCount(rl: readline.Interface): Promise<number> {
  const entriesInput = await askQuestion(rl, 'Enter the number of entries to create: ');
  const numberOfEntries = Number.parseInt(entriesInput);

  if (isNaN(numberOfEntries) || numberOfEntries <= 0) {
    console.log('❌ Please enter a valid positive number.');
    throw new Error('Invalid entry count');
  }

  return numberOfEntries;
}

export async function askForContentTypeName(rl: readline.Interface): Promise<string> {
  const contentTypeName = await askQuestion(rl, 'Enter the name of the content type: ');

  if (!contentTypeName) {
    console.log('❌ Content type name cannot be empty.');
    throw new Error('Empty content type name');
  }

  return contentTypeName;
}

export async function confirmDeletion(
  rl: readline.Interface,
  entryCount: number
): Promise<boolean> {
  const confirmation = await askQuestion(
    rl,
    `\n⚠️  Are you sure you want to delete ALL ${entryCount} entries? (yes/no): `
  );

  return confirmation.toLowerCase() === 'yes';
}
