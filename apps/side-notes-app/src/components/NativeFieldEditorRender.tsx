import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Box } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { lazy, Suspense, useMemo } from 'react';

import useSWR from 'swr';
import { useWidgetStore } from '../stores/widgets.store';

const BooleanEditor = lazy(() =>
  import('@contentful/field-editor-boolean').then((m) => ({
    default: m.BooleanEditor,
  }))
);
const DateEditor = lazy(() =>
  import('@contentful/field-editor-date').then((m) => ({
    default: m.DateEditor,
  }))
);

const UrlEditor = lazy(() =>
  import('@contentful/field-editor-url').then((m) => ({
    default: m.UrlEditor,
  }))
);

const RadioEditor = lazy(() =>
  import('@contentful/field-editor-radio').then((m) => ({
    default: m.RadioEditor,
  }))
);

const CheckboxEditor = lazy(() =>
  import('@contentful/field-editor-checkbox').then((m) => ({
    default: m.CheckboxEditor,
  }))
);

const DropdownEditor = lazy(() =>
  import('@contentful/field-editor-dropdown').then((m) => ({
    default: m.DropdownEditor,
  }))
);

const SlugEditor = lazy(() =>
  import('@contentful/field-editor-slug').then((m) => ({
    default: m.SlugEditor,
  }))
);

const JsonEditor = lazy(() =>
  import('@contentful/field-editor-json').then((m) => ({
    default: m.JsonEditor,
  }))
);
const ListEditor = lazy(() =>
  import('@contentful/field-editor-list').then((m) => ({
    default: m.ListEditor,
  }))
);

const TagsEditor = lazy(() =>
  import('@contentful/field-editor-tags').then((m) => ({
    default: m.TagsEditor,
  }))
);

const RatingEditor = lazy(() =>
  import('@contentful/field-editor-rating').then((m) => ({
    default: m.RatingEditor,
  }))
);

const MarkdownEditor = lazy(() =>
  Promise.all([
    import('@contentful/field-editor-markdown'),
    import('codemirror/lib/codemirror.css'),
  ]).then(([m]) => ({
    default: m.MarkdownEditor,
  }))
);
const MultipleMediaEditor = lazy(() =>
  import('@contentful/field-editor-reference').then((m) => ({
    default: m.MultipleMediaEditor,
  }))
);
const MultipleEntryReferenceEditor = lazy(() =>
  import('@contentful/field-editor-reference').then((m) => ({
    default: m.MultipleEntryReferenceEditor,
  }))
);
const NumberEditor = lazy(() =>
  import('@contentful/field-editor-number').then((m) => ({
    default: m.NumberEditor,
  }))
);
const RichTextEditor = lazy(() =>
  import('@contentful/field-editor-rich-text').then((m) => ({
    default: m.RichTextEditor,
  }))
);
const SingleEntryReferenceEditor = lazy(() =>
  import('@contentful/field-editor-reference').then((m) => ({
    default: m.SingleEntryReferenceEditor,
  }))
);
const SingleLineEditor = lazy(() =>
  import('@contentful/field-editor-single-line').then((m) => ({
    default: m.SingleLineEditor,
  }))
);
const SingleMediaEditor = lazy(() =>
  import('@contentful/field-editor-reference').then((m) => ({
    default: m.SingleMediaEditor,
  }))
);

export const NativeFieldEditorRender = (props: { mockSdk?: any; contentTypeId: string }) => {
  return (
    <Suspense fallback={null}>
      <NativeFieldEditorRenderLazy {...props} />
    </Suspense>
  );
};

const NativeFieldEditorRenderLazy = ({
  mockSdk,
  contentTypeId,
}: {
  mockSdk?: any;
  contentTypeId: string;
}) => {
  const sdk = mockSdk || useSDK<FieldExtensionSDK>();

  const parameters = sdk.parameters?.installation;

  const cma = useCMA();

  const { data: editorInterface } = useSWR('editor-interfaces', () => {
    if (!contentTypeId) return undefined;
    return cma.editorInterface.get({ contentTypeId });
  });

  const state = useWidgetStore((state) => state);

  const fieldControl = useMemo(() => {
    try {
      const control = parameters?.defs[sdk.contentType.sys.id]?.fields[sdk.field.id]?.control;

      if (control) return control;

      const stateControl = state.contentTypeDefs[contentTypeId]?.fields[sdk.field.id]?.control;

      if (stateControl) return stateControl;

      return editorInterface?.controls?.find((control) => control.fieldId === sdk.field.id);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [parameters, sdk.contentType, sdk.field, contentTypeId, editorInterface]);

  if (!sdk?.field?.type) return null;
  const isMocked = !!mockSdk;

  switch (sdk.field.type) {
    case 'Array': {
      switch (sdk.field.items!.type) {
        case 'Link': {
          switch (sdk.field.items!.linkType) {
            case 'Asset':
              return (
                <MultipleMediaEditor
                  sdk={sdk}
                  isInitiallyDisabled={isMocked}
                  parameters={sdk.parameters}
                  viewType="card"
                />
              );
            case 'Entry':
              return (
                <MultipleEntryReferenceEditor
                  sdk={sdk}
                  hasCardEditActions
                  isInitiallyDisabled={isMocked}
                  parameters={sdk.parameters}
                  viewType="card"
                />
              );
          }
        }
        case 'Symbol':
          switch (fieldControl?.widgetId || '') {
            case 'checkbox':
              return (
                <CheckboxEditor
                  field={sdk.field}
                  locales={sdk.locales}
                  isInitiallyDisabled={isMocked}
                />
              );
            case 'tagEditor':
              return <TagsEditor field={sdk.field} isInitiallyDisabled={isMocked} />;
            default:
              return (
                <ListEditor
                  field={sdk.field}
                  locales={sdk.locales}
                  isInitiallyDisabled={isMocked}
                />
              );
          }
      }
    }
    case 'Boolean':
      return <BooleanEditor field={sdk.field} isInitiallyDisabled={isMocked} />;
    case 'Date':
      return <DateEditor field={sdk.field} isInitiallyDisabled={isMocked} />;
    case 'Number':
      return (
        <Box marginTop="spacingXs" marginBottom="spacingXs">
          <NumberEditor field={sdk.field} isInitiallyDisabled={isMocked} />
        </Box>
      );
    case 'Link': {
      // TODO: add and use `sdk.field.linkType`
      const linkType = sdk.contentType.fields.find(
        //@ts-expect-error type error will be thrown for the mockedSdk
        (field) => field.id === sdk.ids.field
      )!.linkType;

      switch (linkType) {
        case 'Asset':
          return (
            <SingleMediaEditor
              sdk={sdk}
              viewType="card"
              parameters={{ instance: {} }}
              isInitiallyDisabled={isMocked}
            />
          );
        case 'Entry':
          return (
            <SingleEntryReferenceEditor
              sdk={sdk}
              viewType="card"
              parameters={{ instance: {} }}
              hasCardEditActions
              isInitiallyDisabled={isMocked}
            />
          );
      }
      return null;
    }
    case 'Location':
      /**
       * Location field types are currently not supported
       * Details: https://contentful.atlassian.net/browse/TOL-968
       * Returning `null` here is fine as we prevent users from assigning the app to fields via the App Definition and config screen
       */
      return null;

    case 'Integer':
      switch (fieldControl?.widgetId || '') {
        case 'rating':
          return <RatingEditor field={sdk.field} isInitiallyDisabled={isMocked} />;
        default:
          return (
            <Box marginTop="spacingXs" marginBottom="spacingXs">
              <NumberEditor field={sdk.field} isInitiallyDisabled={isMocked} />
            </Box>
          );
      }

    case 'Object':
      return <JsonEditor field={sdk.field} isInitiallyDisabled={isMocked} />;
    case 'RichText':
      // TODO: open Hyperlink modal in Dialog location
      return <RichTextEditor isInitiallyDisabled={isMocked} sdk={sdk} />;
    case 'Symbol': {
      switch (fieldControl?.widgetId || '') {
        case 'dropdown':
          return (
            <DropdownEditor
              isInitiallyDisabled={isMocked}
              field={sdk.field}
              locales={sdk.locales}
            />
          );
        case 'listInput':
          return (
            <ListEditor isInitiallyDisabled={isMocked} field={sdk.field} locales={sdk.locales} />
          );
        case 'urlEditor':
          return <UrlEditor isInitiallyDisabled={isMocked} field={sdk.field} />;
        case 'radio':
          return (
            <RadioEditor isInitiallyDisabled={isMocked} field={sdk.field} locales={sdk.locales} />
          );
        case 'slugEditor':
          return <SlugEditor isInitiallyDisabled={isMocked} field={sdk.field} baseSdk={sdk} />;
        default:
          return (
            <SingleLineEditor
              isInitiallyDisabled={isMocked}
              withCharValidation={true}
              field={sdk.field}
              locales={sdk.locales}
            />
          );
      }
    }
    case 'Text':
      return <MarkdownEditor sdk={sdk} isInitiallyDisabled={isMocked} />;
  }

  return null;
};
