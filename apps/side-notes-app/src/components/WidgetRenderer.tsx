import { locations } from '@contentful/app-sdk';
import { Heading, Note, Paragraph, Text, TextLink } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import styled from 'styled-components';
import { createMockFieldExtensionSDK } from '../locations/config/sdkMock';
import { FieldWidgetDefinition } from '../stores/widgets.store';
import { WidgetElementDefinition, WidgetType } from '../types/types';
import { ActionTrigger } from './ActionTrigger';
import { NativeFieldEditorRender } from './NativeFieldEditorRender';
import { serializeText } from './serializeText';
import { serializeProps } from './utils';
import { WidgetEditorContext } from '../locations/config/editor/WidgetEditorContext';
import { useContext } from 'react';

const TextFromContent = styled(Text)`
  white-space: pre-wrap;
`;

const WidgetTextLink = styled(TextLink)`
  justify-content: flex-start;
`;

export const WidgetRenderer = ({
  widgetDef,
  entity,
  contentTypeId,
}: {
  widgetDef: WidgetElementDefinition;
  entity?: any;
  contentTypeId: string;
}) => {
  const serializedContent = serializeText({ entry: entity }, widgetDef.content);
  const sdk = useSDK();
  const { selectedField } = useContext(WidgetEditorContext);

  const mockFieldExtensionSdk = createMockFieldExtensionSDK({
    ref: selectedField,
  });

  switch (widgetDef.type) {
    case WidgetType.Headline:
      return (
        <Heading marginBottom="none" {...serializeProps(widgetDef.props, { entry: entity })}>
          {serializedContent}
        </Heading>
      );

    case WidgetType.Paragraph:
      return (
        <Paragraph marginBottom="none">
          <TextFromContent {...serializeProps(widgetDef.props, { entry: entity })}>
            {serializedContent}
          </TextFromContent>
        </Paragraph>
      );
    case WidgetType.Link:
      return (
        <WidgetTextLink
          target="_blank"
          rel="noreferrer noopener"
          {...serializeProps(widgetDef.props, { entry: entity })}>
          {serializedContent}
        </WidgetTextLink>
      );
    case WidgetType.ActionTrigger:
      return <ActionTrigger widgetDef={widgetDef} content={serializedContent} />;
    case WidgetType.Note:
      return (
        <Note {...serializeProps(widgetDef.props, { entry: entity })}>{serializedContent}</Note>
      );
    case WidgetType.NativeFieldEditor:
      if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
        return (
          <NativeFieldEditorRender contentTypeId={contentTypeId} mockSdk={mockFieldExtensionSdk} />
        );
      } else {
        return <NativeFieldEditorRender contentTypeId={contentTypeId} />;
      }
    default:
      throw Error('Wrong type');
  }
};
