import { useEffect, useMemo, useState } from 'react';
import { Box, Button } from '@contentful/f36-components';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import { createClient } from 'contentful-management';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import RichTextModel from '@utils/richTextModel';
import prompts from '@utils/prompts';
import { SidebarAppSDK } from '@contentful/app-sdk';
import OpenAIError from '@/components/sidebar/components/OpenAIError';
import SelectAction from '@/components/sidebar/components/SelectAction';
import ContentOutput from '@/components/sidebar/components/10-title/ContentOutput';
import Language from '@/components/sidebar/components/10-title/Language';
import Topic from '@/components/sidebar/components/20-content/Topic';
import Field from '@/components/sidebar/components/30-translate/Field';
import SourceLanguage from '@/components/sidebar/components/30-translate/SourceLanguage';
import TargetLanguage from '@/components/sidebar/components/30-translate/TargetLanguage';
import SourceOfDescription from '@/components/sidebar/components/40-seoDescription/SourceOfDescription';
import OutputSEO from '@/components/sidebar/components/40-seoDescription/OutputSEO';
import SourceKeywords from '@/components/sidebar/components/50-seoKeywords/SourceKeywords';
import KeywordOutput from '@/components/sidebar/components/50-seoKeywords/KeywordOutput';
import Disclaimer from '@/components/sidebar/components/Disclaimer';

const Visible = ({ children, when }) => {
  return when ? children : null;
};

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const fields = sdk.entry.fields;

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState(fields[sdk.contentType.displayField].getValue() || '');
  const [loading, setLoading] = useState(false);
  const [option, setOption] = useState('0');
  const [field, setField] = useState(null);
  const [richTextFields, setRichTextFields] = useState([]);
  const [textFields, setTextFields] = useState([]);
  const [translateableTextFields, setTranslateableTextFields] = useState([]);
  const [sourceLocale, setSourceLocale] = useState(sdk.locales.default);
  const [targetLocale, setTargetLocale] = useState(sdk.locales.default);

  useAutoResizer();

  async function Prompt(content: string) {
    const { model = 'gpt-3.5-turbo', profile } = sdk.parameters.installation;
    const GPTPayload = {
      model,
      messages: [
        {
          role: 'system',
          content: `Forget everything from the previous conversation. `,
        },
        {
          role: 'system',
          content: `You are working for a company with the following profile: ${profile} Your response should only be in ${sdk.locales.names[targetLocale]}.`,
        },
        {
          role: 'user',
          content,
        },
      ],
    };

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sdk.parameters.installation.key,
      },
      method: 'POST',
      body: JSON.stringify(GPTPayload),
    })
      .then((res) => {
        return Promise.all([res.json(), res]);
      })
      .then((args) => {
        const [json, res] = args;
        if (res.status !== 200) {
          let message = json?.error?.message || res.statusText;
          if (!message) {
            switch (res.status) {
              case 429:
                message = 'Too many requests. Please try again later.';
                break;
              default:
                message = 'Something went wrong. Please try again later.';
            }
          }
          setError(message);
          throw new Error(`Error: ${res.status} ${message}`);
        }

        return json;
      });

    return response.choices[0].message.content;
  }

  useEffect(() => {
    // Find ALL the fields in document, including the ones that are going up the tree
    async function getTree() {
      const entries = await cma.entry.getMany({
        query: {
          links_to_entry: sdk.entry.getSys().id,
        },
      });
      if (entries.total > 0) {
        const entry = entries.items[0];
        const contentType = await cma.contentType.get({
          contentTypeId: entry.sys.contentType.sys.id,
        });
        // Merge the content types with the locale info
        const fields = contentType.fields.map((field) => {
          field.locales = entry.fields[field.id] ? Object.keys(entry.fields[field.id]) : [];
          return field;
        });
        const parentRichTextFields = fields
          .filter((field) => field.type === 'RichText')
          .filter((field) => field.locales.includes(targetLocale));
        // Merge the new fields with the existing ones from the parent, but indicate they are not visibile inside the current editor
        setRichTextFields([
          ...richTextFields,
          ...parentRichTextFields.map((field) => {
            return {
              name: field.name,
              data: entry.fields[field.id][targetLocale],
              currentEditor: false,
            };
          }),
        ]);
      }
    }
    getTree();
  }, [cma.contentType, cma.entry, richTextFields, sdk.entry, targetLocale]);

  useMemo(() => {
    const fields = sdk.entry.fields;
    const textFields = Object.keys(fields)
      .filter((key) => fields[key].type === 'Symbol' || fields[key].type === 'Text')
      .filter((key) => fields[key].locales.includes(targetLocale));
    setTextFields(
      textFields.map((field) => {
        return { name: field, currentEditor: true };
      })
    );

    const richTextFields = Object.keys(fields)
      .filter((key) => fields[key].type === 'RichText')
      .filter((key) => fields[key].locales.includes(targetLocale));
    setRichTextFields(
      richTextFields.map((field) => {
        return { name: field, currentEditor: true };
      })
    );

    const translateableTextFields = Object.keys(fields).filter(
      (key) =>
        (fields[key].type === 'RichText' ||
          fields[key].type === 'Symbol' ||
          fields[key].type === 'Text') &&
        fields[key]?.locales?.length > 1
    );
    setTranslateableTextFields(
      translateableTextFields.map((field) => {
        return { name: field, currentEditor: true, locales: fields[field].locales };
      })
    );
  }, [sdk.entry.fields, targetLocale]);

  function SetValueToField(field, value, locale = targetLocale) {
    field.setValue(
      field.type === 'RichText'
        ? RichTextModel(value)
        : value
            .replace(/^\s+|\s+$/g, '')
            .replace(/^['"]+|['"]+$/g, '')
            .trim(), // trim whitespace and quotes
      locale // always write this to the default locale
    );
  }

  function getFieldName(id) {
    return sdk.contentType.fields.find((field) => field.id === id)?.name || id;
  }

  useEffect(() => {
    // if translating, set the target locale to the first available locale that is not the source locale
    if (option === '30') {
      const targetLocale = sdk.locales.available.find((l) => l !== sourceLocale);
      setTargetLocale(targetLocale);
    }
  }, [option, sdk.locales.available, sourceLocale]);

  async function Render(as = 'title', prompt = null) {
    try {
      let input = '';
      setLoading(true);

      if (as === 'translation') {
        const sourceValue =
          fields[field].type === 'RichText'
            ? documentToPlainTextString(fields[field].getValue(sourceLocale))
            : sdk.entry.fields[field].getValue(sourceLocale);
        input = `Translate "${sourceValue}" to ${sdk.locales.names[targetLocale]}`;
      } else {
        input = prompts({ as });
      }

      const response = await Prompt(prompt ? input.replace('__prompt__', prompt) : input);
      SetValueToField(sdk.entry.fields[field], response, targetLocale);
      // Use the response coming back as an input prompt in the interface by default
      setPrompt(response);
      sdk.notifier.success('Done! Anything else?');
    } catch (e) {
      console.error(e);
      sdk.notifier.error(e.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
      setOption('0');
    }
  }

  const handleActionChange = (e) => {
    // reset
    setField(null);
    setPrompt('');
    setSourceLocale(sdk.locales.default);
    setTargetLocale(sdk.locales.default);

    // set option
    setOption(e.target.value);
  };

  return (
    <Box style={{ padding: '0 3px' }}>
      {error && <OpenAIError error={error} />}

      <SelectAction />

      <Visible when={option === '10'}>
        <ContentOutput />

        {sdk.locales.available?.length > 1 && <Language />}
        <Button
          variant="primary"
          onClick={() => Render('title')}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Generating title...' : 'Generate a title'}
        </Button>
      </Visible>

      {/* content  */}
      <Visible when={option === '20'}>
        {sdk.locales.available?.length > 1 && <Language />}

        <Topic />

        <Output />
        <Button
          variant="primary"
          onClick={() => Render('body', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading || !prompt}>
          {loading ? 'Generating content...' : 'Generate content'}
        </Button>
      </Visible>

      {/* Translate  */}
      <Visible when={option === '30'}>
        <Field />
        <SourceLanguage />
        <TargetLanguage />

        <Button
          variant="primary"
          onClick={() => Render('translation')}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Generating translation...' : 'Translate'}
        </Button>
      </Visible>

      {/* SEO description  */}
      <Visible when={option === '40'}>
        <SourceOfDescription />
        <OutputSEO />
        <Button
          variant="primary"
          onClick={() => Render('seo_description', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Generating description...' : 'Generate description'}
        </Button>
      </Visible>

      {/* SEO keywords  */}
      <Visible when={option === '50'}>
        <SourceKeywords />
        <KeywordOutput />
        <Button
          variant="primary"
          onClick={() => Render('seo_keywords', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Generating keywords...' : 'Generate keywords'}
        </Button>
      </Visible>

      <Disclaimer />
    </Box>
  );
};

export default Sidebar;
