import contentful from "contentful-management";

export async function createCMAClient() {
    if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
        throw new Error('Cannot find CMA token');
    }

    const client = contentful.createClient({
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
      });

    return client;
}