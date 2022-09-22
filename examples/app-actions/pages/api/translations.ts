import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';

import { runMiddleware, sendError } from '../../src/lib/utils';
import { loadConfiguration } from '../../src/lib/config';
import { contentfulContext } from '../../src/lib/contentful-context';
import { translate } from '../../src/lib/translate';

const contentfulContextMiddleware = contentfulContext(loadConfiguration());

export default async function handler(request: Request, response: Response) {
  // Enrich the request object with a Contentful Context.
  // This middleware verifies and authorizes incoming requests and
  // gives access to the CMA client and App Installation parameters
  // through the `contentfulContext` object
  await runMiddleware(request, response, contentfulContextMiddleware);

  // Parse the body and get access to `contentfulContext` mentioned above
  const { body: stringBody, contentfulContext } = request;
  const body = JSON.parse(stringBody);

  // Simple validation of the payload.
  // The action we have configured for this endpoint has category `Entries`,
  // meaning we are going to get a list of comma separated entry ids in `body.entryIds`
  if (!body || !body.entryIds || typeof body.entryIds !== 'string') {
    return sendError(StatusCodes.BAD_REQUEST, { response, details: '`body.entryIds` is invalid' });
  }

  // Utilize cma client from the context to fetch the entries in entryIds
  const { items: entries } = await contentfulContext.cma.entry.getMany({
    query: { 'sys.id[in]': body.entryIds },
  });

  // Update the entries
  for (const entry of entries) {
    entry.fields.title = await translate(
      entry.fields.title,
      (contentfulContext.parameters as { targetLanguage?: string }).targetLanguage
    );
  }

  await Promise.all(
    entries.map((e) => contentfulContext.cma.entry.update({ entryId: e.sys.id }, e))
  );

  response.status(StatusCodes.OK).send();
}
