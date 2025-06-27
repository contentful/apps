import { Button, Flex } from '@contentful/f36-components';
import { EntryFieldAPI, SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const SUPPORTED_FIELD_TYPES = [
    'Symbol',
    'Text',
    'RichText',
    'Number',
    'Integer',
    'Array',
    'Link',
    'Date',
    'Location',
  ];

  const isSupported = (field: EntryFieldAPI) => {
    if (field.type === 'Link') {
      return field.linkType === 'Asset';
    } else if (field.type === 'Array') {
      return field.items.type === 'Symbol' || field.items.linkType === 'Asset';
    }
    return SUPPORTED_FIELD_TYPES.includes(field.type);
  };

  const fields = [];
  for (const field of Object.values(sdk.entry.fields)) {
    const linkType = (field as any).linkType && { linkType: (field as any).linkType };
    const items = (field as any).items && {
      items: {
        type: (field as any).items.type,
        linkType: (field as any).items.linkType,
      },
    };
    const supported = isSupported(field);

    if (field.locales.length === 1) {
      fields.push({
        type: field.type,
        id: field.id,
        uniqueId: field.id,
        name: field.name,
        ...linkType,
        ...items,
        supported: supported,
        value: field.getValue(),
      });
    } else {
      for (const locale of field.locales) {
        fields.push({
          type: field.type,
          id: field.id,
          uniqueId: `${field.id}-${locale}`,
          name: field.name,
          locale: locale,
          ...linkType,
          ...items,
          supported: supported,
          value: field.getValue(locale),
        });
      }
    }
  }

  console.log('FIELDS: ', fields);

  const dialogParams = {
    title: 'Sync entry fields to Hubspot',
    parameters: {
      fields: fields,
    },
  };

  return (
    <Flex gap="spacingM" flexDirection="column">
      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={() => sdk.dialogs.openCurrentApp(dialogParams)}>
        Sync entry fields to Hubspot
      </Button>

      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={() => sdk.navigator.openCurrentAppPage()}>
        View all connected entries
      </Button>
    </Flex>
  );
};

export default Sidebar;
