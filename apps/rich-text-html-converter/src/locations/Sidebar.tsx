import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Flex, FormControl, Note, Subheading, Textarea } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import { htmlToRichText } from '../utils/htmlToRichText';

type Status = 'idle' | 'loading' | 'success' | 'error';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const richTextFields = sdk.contentType.fields.filter(f => f.type === 'RichText');
  const [htmlInputs, setHtmlInputs] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const handleConvert = async (fieldId: string) => {
    const html = (htmlInputs[fieldId] ?? '').trim();
    if (!html) return;

    setStatuses(prev => ({ ...prev, [fieldId]: 'loading' }));
    try {
      const document = htmlToRichText(html);
      await sdk.entry.fields[fieldId].setValue(document);
      setStatuses(prev => ({ ...prev, [fieldId]: 'success' }));
      setHtmlInputs(prev => ({ ...prev, [fieldId]: '' }));
    } catch {
      setStatuses(prev => ({ ...prev, [fieldId]: 'error' }));
    }
  };

  if (richTextFields.length === 0) {
    return (
      <Note variant="neutral">
        No Rich Text fields found in this content type.
      </Note>
    );
  }

  return (
    <Flex flexDirection="column" gap="spacingM">
      <Subheading>Convert HTML to Rich Text</Subheading>
      {richTextFields.map(field => {
        const status = statuses[field.id] ?? 'idle';
        const html = htmlInputs[field.id] ?? '';
        return (
          <Flex key={field.id} flexDirection="column" gap="spacingS">
            <FormControl>
              <FormControl.Label>{field.name}</FormControl.Label>
              <Textarea
                placeholder="Paste HTML here…"
                value={html}
                rows={5}
                onChange={e => {
                  const value = e.target.value;
                  setHtmlInputs(prev => ({ ...prev, [field.id]: value }));
                  if (statuses[field.id] && statuses[field.id] !== 'loading') {
                    setStatuses(prev => ({ ...prev, [field.id]: 'idle' }));
                  }
                }}
              />
            </FormControl>
            <Button
              variant="primary"
              size="small"
              isDisabled={!html.trim() || status === 'loading'}
              isLoading={status === 'loading'}
              onClick={() => handleConvert(field.id)}
            >
              Convert &amp; Apply
            </Button>
            {status === 'success' && (
              <Note variant="positive">Rich Text field updated successfully.</Note>
            )}
            {status === 'error' && (
              <Note variant="negative">Failed to convert or save. Check the HTML and try again.</Note>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
};

export default Sidebar;
