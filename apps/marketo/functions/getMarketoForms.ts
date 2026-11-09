import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoApiError } from './exceptions';
import { getMarketoToken } from './getMarketoToken';
import type { AppInstallationParameters, FormObject, MarketoFormsResponse } from '../src/types';

// Marketo's maximum page size for asset browse endpoints.
const FORMS_PAGE_SIZE = 200;
// Pages fetched per call. One auth covers all of them, and fewer calls load
// a large form list faster. The pages after the first run in parallel, well
// under Marketo's limit of 10 concurrent calls per instance.
const PAGES_PER_CALL = 5;

const parseOffset = (value: unknown) => {
  const offset = Number(value ?? 0);
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
};

const fetchFormsPage = async (
  baseUrl: string,
  accessToken: string,
  offset: number
): Promise<FormObject[]> => {
  const response = await fetch(
    `${baseUrl}/rest/asset/v1/forms.json?maxReturn=${FORMS_PAGE_SIZE}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const formsResponse = await response.json();

  if (!response.ok || !formsResponse.success) {
    const errorMessage = formsResponse.message || 'Marketo getForms request failed';

    throw new MarketoApiError(errorMessage, {
      statusCode: response.status,
      errors: formsResponse.errors,
    });
  }

  // Marketo answers an offset past the last form with success and no result.
  const forms: FormObject[] = formsResponse.result ?? [];
  return forms.map(({ id, url, name }) => ({ id, url, name }));
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;
  const offset = parseOffset((event.body as { offset?: unknown } | undefined)?.offset);

  const auth = await getMarketoToken(clientId, clientSecret, munchkinId);
  const baseUrl = `https://${munchkinId}.mktorest.com`;

  // The first page is fetched alone so instances with one page of forms
  // make a single forms.json request.
  const pages = [await fetchFormsPage(baseUrl, auth.access_token, offset)];
  if (pages[0].length === FORMS_PAGE_SIZE) {
    const nextOffsets = Array.from(
      { length: PAGES_PER_CALL - 1 },
      (_, i) => offset + (i + 1) * FORMS_PAGE_SIZE
    );
    const nextPages = await Promise.all(
      nextOffsets.map((pageOffset) => fetchFormsPage(baseUrl, auth.access_token, pageOffset))
    );
    for (const page of nextPages) {
      pages.push(page);
      if (page.length < FORMS_PAGE_SIZE) break;
    }
  }

  const lastPageFull = pages[pages.length - 1].length === FORMS_PAGE_SIZE;
  return {
    forms: pages.flat(),
    ...(lastPageFull && { nextOffset: offset + pages.length * FORMS_PAGE_SIZE }),
  };
};
