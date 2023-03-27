import React, { useEffect, useMemo, useState } from 'react';
import { Button, Select, Stack, TextInput } from '@contentful/f36-components';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import { createClient } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';
import RichTextModel from '../richtTextModel';
import prompts from '../prompts';

const Visible = ({ children, when }) => {
  return when ? children : null;
};

const Sidebar = () => {
  const sdk = useSDK();
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

  // States
  const [prompt, setPrompt] = useState(fields[sdk.contentType.displayField].getValue() || '');
  const [loading, setLoading] = useState(false);
  const [option, setOption] = useState(0);
  const [field, setField] = useState(null);
  const [richTextFields, setRichTextFields] = useState([]);
  const [textFields, setTextFields] = useState([]);
  const [translateableTextFields, setTranslateableTextFields] = useState([]);
  const [sourceLocale, setSourceLocale] = useState(sdk.locales.default || '');
  const [targetLocale, setTargetLocale] = useState(sdk.locales.default || '');
  const [multiLocale, setMultiLocale] = useState(false);

  async function Prompt(content) {
    const { model = 'gpt-3.5-turbo', profile } = sdk.parameters.installation;
    const isGPT = model.startsWith('gpt');
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

    const DavinciPayload = {
      model: 'text-davinci-003',
      prompt: GPTPayload.messages.reduce((acc, cur) => acc + cur.content, ''),
      temperature: 0.8,
      max_tokens: 1000,
    };

    const response = await fetch(`https://api.openai.com/v1${isGPT ? '/chat/' : '/'}completions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sdk.parameters.installation.key,
      },
      method: 'POST',
      body: JSON.stringify(isGPT ? GPTPayload : DavinciPayload),
    }).then((res) => res.json());
    return isGPT ? response.choices[0].message.content : response.choices[0].text;
  }

  function localeSettingsHandler(data) {
    const { mode, focused, active } = data;
    if (mode === 'single') {
      setMultiLocale(false);
      setTargetLocale(focused);
    } else if (mode === 'multi') {
      if (active.length < 2) {
        setTargetLocale(active[0]);
      }
      setMultiLocale(active);
    }
  }

  useEffect(() => {
    const detachHandler = sdk.editor.onLocaleSettingsChanged(localeSettingsHandler);
    return () => detachHandler;
  }, [sdk.editor]);

  useEffect(() => {
    sdk.window.startAutoResizer();
  });

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
        // const fields = entry.fields
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
    const sanitizedValue =
      field.type === 'RichText'
        ? RichTextModel(value)
        : value.replace(/^\n+/, '').replace(/['"]+/g, '').trim(); // removes the line breaks from the beginning of the text, and removes single and double quotes from the beginning and end of the text
    field.setValue(sanitizedValue, locale);
  }

  function getFieldName(id) {
    return sdk.contentType.fields.find((field) => field.id === id)?.name || id;
  }

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
      sdk.notifier.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setOption(0);
    }
  }

  return (
    <Stack flexDirection="column" alignItems="stretch" fullWidth={true}>
      <Select onChange={(event) => setOption(parseInt(event.target.value))} value={option}>
        <Select.Option value={0} isDisabled>
          Please select an option
        </Select.Option>
        <Select.Option value={10}>Suggest a title</Select.Option>
        <Select.Option
          value={20}
          isDisabled={richTextFields?.filter((field) => field.currentEditor).length < 1}>
          Write content
        </Select.Option>
        <Select.Option value={30} isDisabled={!multiLocale || multiLocale?.length < 1}>
          Translate content
        </Select.Option>
        <Select.Option value={40} isDisabled={richTextFields?.length < 1}>
          Write SEO description
        </Select.Option>
        <Select.Option value={50} isDisabled={richTextFields?.length < 1}>
          Write SEO keywords
        </Select.Option>
      </Select>

      {/* Suggest a title  */}
      <Visible when={option === 10}>
        <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
          <Select.Option value="" isDisabled>
            Where should I output the content?
          </Select.Option>
          {textFields
            .filter((field) => field.currentEditor)
            .map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                </Select.Option>
              );
            })}
        </Select>
        {multiLocale && multiLocale?.length > 1 && (
          <Select
            onChange={(event) => setTargetLocale(event.target.value)}
            defaultValue={targetLocale}>
            <Select.Option defaultValue="" isDisabled>
              What language?
            </Select.Option>
            {multiLocale.map((locale) => (
              <Select.Option value={locale} key={locale}>
                {sdk.locales.names[locale]}
              </Select.Option>
            ))}
          </Select>
        )}
        <Button
          variant="primary"
          onClick={() => Render('title')}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Hang on, thinking' : 'Suggest a title'}
        </Button>
      </Visible>

      {/* Write content  */}
      <Visible when={option === 20}>
        {multiLocale && multiLocale?.length > 1 && (
          <Select
            onChange={(event) => setTargetLocale(event.target.value)}
            defaultValue={targetLocale}>
            <Select.Option defaultValue="" isDisabled>
              What language?
            </Select.Option>
            {multiLocale.map((locale) => (
              <Select.Option value={locale} key={locale}>
                {sdk.locales.names[locale]}
              </Select.Option>
            ))}
          </Select>
        )}
        <TextInput
          type="text"
          name="prompt"
          placeholder="Please provide a topic"
          value={prompt}
          onInput={(event) => setPrompt(event.target.value)}
        />

        <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
          <Select.Option value="" isDisabled>
            Where should I output the content?
          </Select.Option>
          {richTextFields
            .filter((field) => field.currentEditor)
            .map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                </Select.Option>
              );
            })}
        </Select>
        <Button
          variant="primary"
          onClick={() => Render('body', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Hang on, working' : 'Generate'}
        </Button>
      </Visible>

      {/* Translate content  */}
      <Visible when={option === 30}>
        <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
          <Select.Option value="" isDisabled>
            Which field should I translate from?
          </Select.Option>
          {translateableTextFields.map((field, index) => {
            return (
              <Select.Option value={field.name} key={index}>
                {getFieldName(field.name)}
              </Select.Option>
            );
          })}
        </Select>
        <Select
          value={sourceLocale || ''}
          onChange={(event) => setSourceLocale(event.target.value)}>
          <Select.Option value="" isDisabled>
            Where to translate from?
          </Select.Option>
          {sdk.locales.available.map((locale, index) => {
            return (
              <Select.Option
                value={locale}
                key={index}
                isDisabled={multiLocale?.length && !multiLocale?.includes(locale)}>
                {sdk.locales.names[locale]}
              </Select.Option>
            );
          })}
        </Select>
        <Select
          value={targetLocale || ''}
          onChange={(event) => setTargetLocale(event.target.value)}>
          <Select.Option value="" isDisabled>
            Where to translate into?
          </Select.Option>
          {sdk.locales.available.map((locale, index) => {
            return (
              <Select.Option
                value={locale}
                key={index}
                isDisabled={multiLocale.length && !multiLocale?.includes(locale)}>
                {sdk.locales.names[locale]}
              </Select.Option>
            );
          })}
        </Select>
        <Button
          variant="primary"
          onClick={() => Render('translation')}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Hang on, translating' : 'Translate'}
        </Button>
      </Visible>

      {/* Write SEO description  */}
      <Visible when={option === 40}>
        <Select
          defaultValue=""
          onChange={(event) => {
            const field = richTextFields.find((field) => field.name === event.target.value);
            const value = field.currentEditor
              ? sdk.entry.fields[field.name].getValue()
              : field.data;
            setPrompt(documentToPlainTextString(value));
          }}>
          <Select.Option value="" isDisabled>
            What should I write a description for?
          </Select.Option>
          {richTextFields.map((field, index) => {
            return (
              <Select.Option value={field.name} key={index}>
                {getFieldName(field.name)}
                {!field.currentEditor && ' (from parent)'}
              </Select.Option>
            );
          })}
        </Select>
        <Select defaultValue={field} onChange={(event) => setField(event.target.value)}>
          <Select.Option value="" isDisabled>
            Where should I output the description?
          </Select.Option>
          {textFields.map((field, index) => {
            return (
              <Select.Option value={field.name} key={index}>
                {getFieldName(field.name)}
              </Select.Option>
            );
          })}
        </Select>
        <Button
          variant="primary"
          onClick={() => Render('seo_description', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Negotiating with search engines..' : 'Render SEO description'}
        </Button>
      </Visible>

      {/* Write SEO keywords  */}
      <Visible when={option === 50}>
        <Select
          defaultValue=""
          onChange={(event) => {
            const field = richTextFields.find((field) => field.name === event.target.value);
            const value = field.currentEditor
              ? sdk.entry.fields[field.name].getValue()
              : field.data;
            setPrompt(documentToPlainTextString(value));
          }}>
          <Select.Option value="" isDisabled>
            What should I write a description for?
          </Select.Option>
          {richTextFields.map((field, index) => {
            return (
              <Select.Option value={field.name} key={index}>
                {getFieldName(field.name)}
              </Select.Option>
            );
          })}
        </Select>
        <Select defaultValue={field} onChange={(event) => setField(event.target.value)}>
          <Select.Option value="" isDisabled>
            Where should I output the keywords?
          </Select.Option>
          {textFields.map((field, index) => {
            return (
              <Select.Option value={field.name} key={index}>
                {getFieldName(field.name)}
              </Select.Option>
            );
          })}
        </Select>
        <Button
          variant="primary"
          onClick={() => Render('seo_keywords', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Negotiating with search engines.. ' : 'Render SEO keywords'}
        </Button>
      </Visible>
    </Stack>
  );
};

export default Sidebar;
