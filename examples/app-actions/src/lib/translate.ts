import { URL } from 'url';
import got from 'got';

type FunTranslationResponse = Partial<{
  success: {
    total: number;
  };
  contents: {
    translated: string;
    text: string;
    translation: string;
  };
}>;
const FUN_TRANSLATIONS_BASE_API_URL = 'https://api.funtranslations.com';

export const translate = async (text: string, targetLanguage = 'mandalorian') => {
  const url = new URL(`/translate/${targetLanguage}.json`, FUN_TRANSLATIONS_BASE_API_URL);

  try {
    const body = (await got
      .post(url, {
        headers: { 'content-type': 'application/json' },
        json: { text },
      })
      .json()) as FunTranslationResponse;

    return body && body.contents ? body.contents.translated : undefined;
  } catch (e) {
    throw new Error(
      [`Unable to fetch from ${FUN_TRANSLATIONS_BASE_API_URL}.`, `Details: ${String(e)}`].join('\n')
    );
  }
};
