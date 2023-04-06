import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  Note,
  Select,
  Paragraph,
  Textarea,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
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

  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState(fields[sdk.contentType.displayField].getValue() || '');
  const [loading, setLoading] = useState(false);
  const [option, setOption] = useState('0');
  const [field, setField] = useState(null);
  const [richTextFields, setRichTextFields] = useState([]);
  const [textFields, setTextFields] = useState([]);
  const [translateableTextFields, setTranslateableTextFields] = useState([]);
  const [sourceLocale, setSourceLocale] = useState(sdk.locales.default);
  const [targetLocale, setTargetLocale] = useState(sdk.locales.default);

  async function Prompt(content) {
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
      {error && (
        <FormControl>
          <Note variant="negative">
            <Paragraph marginBottom="spacingXs" fontWeight="fontWeightMedium">
              OpenAI API Error
            </Paragraph>
            {error}
          </Note>
        </FormControl>
      )}
      <FormControl>
        <FormControl.Label>Select an action</FormControl.Label>
        <Select onChange={handleActionChange} value={option}>
          <Select.Option value="0" isDisabled>
            Select an option...
          </Select.Option>
          <Select.Option value="10">Generate a title</Select.Option>
          <Select.Option
            value="20"
            isDisabled={richTextFields?.filter((field) => field.currentEditor).length < 1}>
            Generate content
          </Select.Option>
          <Select.Option value="30" isDisabled={sdk.locales.available?.length < 1}>
            Translate content
          </Select.Option>
          <Select.Option value="40" isDisabled={richTextFields?.length < 1}>
            Generate SEO description
          </Select.Option>
          <Select.Option value="50" isDisabled={richTextFields?.length < 1}>
            Generate SEO keywords
          </Select.Option>
        </Select>
      </FormControl>
      <Visible when={option === '10'}>
        <FormControl>
          <FormControl.Label>Where should the content be output?</FormControl.Label>
          <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
            <Select.Option value="" isDisabled>
              Select a field...
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
        </FormControl>
        {sdk.locales.available?.length > 1 && (
          <FormControl>
            <FormControl.Label>What language?</FormControl.Label>
            <Select
              onChange={(event) => setTargetLocale(event.target.value)}
              defaultValue={sourceLocale}>
              <Select.Option defaultValue="" isDisabled>
                Select a language...
              </Select.Option>
              {sdk.locales.available.map((locale) => (
                <Select.Option value={locale} key={locale}>
                  {sdk.locales.names[locale]}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        )}
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
        {sdk.locales.available?.length > 1 && (
          <FormControl>
            <FormControl.Label>What language?</FormControl.Label>
            <Select
              onChange={(event) => setTargetLocale(event.target.value)}
              defaultValue={sourceLocale}>
              <Select.Option defaultValue="" isDisabled>
                Select a language...
              </Select.Option>
              {sdk.locales.available.map((locale) => (
                <Select.Option value={locale} key={locale}>
                  {sdk.locales.names[locale]}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl>
          <FormControl.Label>Provide a topic</FormControl.Label>
          <Textarea
            rows={5}
            name="prompt"
            placeholder="Example: 'How to make a gourmet sandwich'"
            value={prompt}
            onInput={(event) => setPrompt(event.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormControl.Label>Where should the content be output?</FormControl.Label>
          <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
            <Select.Option value="" isDisabled>
              Select a field...
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
        </FormControl>
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
        <FormControl>
          <FormControl.Label>Which field should be translated?</FormControl.Label>
          <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
            <Select.Option value="" isDisabled>
              Select a field...
            </Select.Option>
            {translateableTextFields.map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Source Language</FormControl.Label>
          <Select
            value={sourceLocale || ''}
            onChange={(event) => {
              setSourceLocale(event.target.value);
              if (event.target.value === targetLocale) setTargetLocale('');
            }}>
            <Select.Option value="" isDisabled>
              Where to translate from?
            </Select.Option>
            {sdk.locales.available.map((locale, index) => {
              return (
                <Select.Option value={locale} key={index}>
                  {sdk.locales.names[locale]}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Target Language</FormControl.Label>
          <Select
            value={targetLocale || ''}
            onChange={(event) => {
              setTargetLocale(event.target.value);
              if (event.target.value === sourceLocale) setSourceLocale('');
            }}>
            <Select.Option value="" isDisabled>
              Where to translate into?
            </Select.Option>
            {sdk.locales.available.map((locale, index) => {
              return (
                <Select.Option value={locale} key={index} isDisabled={locale === sourceLocale}>
                  {sdk.locales.names[locale]}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
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
        <FormControl>
          <FormControl.Label>What should be the source of the description?</FormControl.Label>
          <Select
            defaultValue=""
            onChange={(event) => {
              const field = [...richTextFields, ...textFields].find(
                (field) => field.name === event.target.value
              );
              const value = field.currentEditor
                ? sdk.entry.fields[field.name].getValue()
                : field.data;
              setPrompt(documentToPlainTextString(value));
            }}>
            <Select.Option value="" isDisabled>
              Select a field...
            </Select.Option>
            {[...richTextFields, ...textFields].map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                  {!field.currentEditor && ' (from parent)'}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Where should the description be output?</FormControl.Label>
          <Select defaultValue={field} onChange={(event) => setField(event.target.value)}>
            <Select.Option value="" isDisabled>
              Select a field...
            </Select.Option>
            {textFields.map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
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
        <FormControl>
          <FormControl.Label>
            What should be the source to generate keywords from?
          </FormControl.Label>
          <Select
            defaultValue=""
            onChange={(event) => {
              const field = [...richTextFields, ...textFields].find(
                (field) => field.name === event.target.value
              );
              const value = field.currentEditor
                ? sdk.entry.fields[field.name].getValue()
                : field.data;
              setPrompt(documentToPlainTextString(value));
            }}>
            <Select.Option value="" isDisabled>
              Select a field...
            </Select.Option>
            {[...richTextFields, ...textFields].map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Where should the keywords be output?</FormControl.Label>{' '}
          <Select defaultValue={field} onChange={(event) => setField(event.target.value)}>
            <Select.Option value="" isDisabled>
              Select a field...
            </Select.Option>
            {textFields.map((field, index) => {
              return (
                <Select.Option value={field.name} key={index}>
                  {getFieldName(field.name)}
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
        <Button
          variant="primary"
          onClick={() => Render('seo_keywords', prompt)}
          isFullWidth
          isLoading={loading}
          isDisabled={loading}>
          {loading ? 'Generating keywords...' : 'Generate keywords'}
        </Button>
      </Visible>
      <FormControl marginTop="spacingL">
        <FormControl.HelpText>
          This feature uses a third party AI tool. Please ensure your use of the tool and any
          AI-generated content complies with applicable laws, your company's policies, and all other{' '}
          <TextLink
            icon={<ExternalLinkTrimmedIcon />}
            alignIcon="end"
            href="https://openai.com/policies"
            target="_blank"
            rel="noopener noreferrer">
            Terms and Policies
          </TextLink>{' '}
        </FormControl.HelpText>
      </FormControl>
    </Box>
  );
};

export default Sidebar;
