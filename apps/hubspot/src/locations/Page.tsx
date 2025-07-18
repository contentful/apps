import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Heading,
  Stack,
  Badge,
  Notification,
  TextInput,
  Modal,
  Flex,
  Box,
  Textarea,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './Page.styles';
import { C } from 'vitest/dist/chunks/reporters.d.C1ogPriE';

interface HubSpotEmail {
  id: string;
  name: string;
  subject: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  type?: string;
  content?: {
    widgets?: Record<
      string,
      {
        body?: {
          html?: string;
        };
        type?: string;
        id?: string;
      }
    >;
  };
  contentBlocks?: ContentBlock[];
  contentBlocksCount?: number;
  from?: {
    fromName?: string;
    replyTo?: string;
  };
  isPublished?: boolean;
}

interface ContentBlock {
  widgetId: string;
  type: string;
  order: number;
  name: string;
  html: string;
  textContent: string;
  textPreview: string;
  characterCount: number;
}

interface TextNode {
  id: string;
  textContent: string;
  tagName: string;
  index: number;
}

interface EmailUpdateData {
  name: string;
  subject: string;
  fromName: string;
  replyTo: string;
  contentBlocks: {
    [widgetId: string]: {
      textNodes: TextNode[];
      originalHtml: string;
    };
  };
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const cma = useCMA();

  // State
  const [emails, setEmails] = useState<HubSpotEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [editingEmail, setEditingEmail] = useState<HubSpotEmail | null>(null);
  const [updateData, setUpdateData] = useState<EmailUpdateData>({
    name: '',
    subject: '',
    fromName: '',
    replyTo: '',
    contentBlocks: {},
  });
  const [updating, setUpdating] = useState(false);
  const [hubspotAppActionId, setHubspotEmailAction] = useState<string>('');

  // Helper function to extract individual text nodes from HTML
  const extractTextNodes = (html: string): TextNode[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const textNodes: TextNode[] = [];
    let index = 0;

    const walkNodes = (node: Node, parentTag: string = '') => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          textNodes.push({
            id: `text-${index}`,
            textContent: text,
            tagName: parentTag || 'text',
            index: index,
          });
          index++;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        for (let child of Array.from(node.childNodes)) {
          walkNodes(child, tagName);
        }
      }
    };

    walkNodes(doc.body);
    return textNodes;
  };

  // Helper function to parse HTML content and extract text nodes
  const parseHtmlContent = (html: string) => {
    const textNodes = extractTextNodes(html);

    return {
      textNodes,
      originalHtml: html,
    };
  };

  // Helper function to get editable content blocks from email
  const getContentBlocks = (email: HubSpotEmail): ContentBlock[] => {
    // Use the processed content blocks from the API response if available
    if (email.contentBlocks) {
      return email.contentBlocks;
    }

    // Fallback to parsing from widgets (legacy)
    if (!email.content?.widgets) return [];

    return Object.entries(email.content.widgets)
      .filter(([_, widget]) => widget.body?.html && widget.body.html.trim())
      .map(([widgetId, widget]) => {
        const parsed = parseHtmlContent(widget.body!.html!);
        const allTextContent = parsed.textNodes.map((node) => node.textContent).join(' ');

        return {
          widgetId,
          type: 'unknown',
          order: 0,
          name: widgetId,
          html: widget.body!.html!,
          textContent: allTextContent,
          textPreview: allTextContent.substring(0, 100),
          characterCount: allTextContent.length,
        };
      });
  };

  useEffect(() => {
    const getAppActions = async () => {
      const appActions = await cma.appAction.getManyForEnvironment({});
      const hubspotEmailAction = appActions.items.find((appAction) => {
        if (appAction.name === 'Hubspot Email Action') {
          return appAction;
        }
      });
      setHubspotEmailAction(hubspotEmailAction?.sys.id || '');
    };

    getAppActions();
  }, []);

  // Test HubSpot connection and fetch emails
  const fetchHubSpotEmails = async () => {
    try {
      setLoading(true);
      console.log('Fetching HubSpot emails...');

      const res = await cma.appActionCall.createWithResponse(
        {
          appDefinitionId: sdk.ids.app || '',
          appActionId: hubspotAppActionId,
        },
        {
          parameters: {
            method: 'GET',
          },
        }
      );

      console.log('HubSpot response:', res);
      console.log('HubSpot response BODY:', JSON.parse(res.response.body));

      if (res.response) {
        const emailData = JSON.parse(res.response.body).results;
        console.log('Email data:', emailData, res);

        if (emailData) {
          setEmails(emailData);
          setConnected(true);
          Notification.success(`Successfully fetched ${emailData.length} emails from HubSpot!`);
        } else {
          setConnected(true);
          Notification.success('Connected to HubSpot but no emails found.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      Notification.error('Failed to connect to HubSpot. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (email: HubSpotEmail) => {
    setEditingEmail(email);
    const contentBlocks = getContentBlocks(email);

    // Create content blocks object for editing (extracting individual text nodes)
    const contentBlocksData: {
      [widgetId: string]: { textNodes: TextNode[]; originalHtml: string };
    } = {};
    contentBlocks.forEach((block) => {
      contentBlocksData[block.widgetId] = parseHtmlContent(block.html);
    });

    setUpdateData({
      name: email.name || '',
      subject: email.subject || '',
      fromName: email.from?.fromName || '',
      replyTo: email.from?.replyTo || '',
      contentBlocks: contentBlocksData,
    });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingEmail(null);
    setUpdateData({ name: '', subject: '', fromName: '', replyTo: '', contentBlocks: {} });
  };

  // Update individual text node
  const updateTextNode = (widgetId: string, textNodeId: string, newText: string) => {
    setUpdateData((prev) => ({
      ...prev,
      contentBlocks: {
        ...prev.contentBlocks,
        [widgetId]: {
          ...prev.contentBlocks[widgetId],
          textNodes: prev.contentBlocks[widgetId].textNodes.map((node) =>
            node.id === textNodeId ? { ...node, textContent: newText } : node
          ),
        },
      },
    }));
  };

  // Update email
  const updateEmail = async () => {
    if (!editingEmail) return;

    try {
      setUpdating(true);
      console.log('Updating email:', editingEmail.id);

      const res = await cma.appActionCall.createWithResponse(
        {
          appDefinitionId: sdk.ids.app || '',
          appActionId: hubspotAppActionId,
        },
        {
          parameters: {
            method: 'PATCH',
            emailId: editingEmail.id,
            name: updateData.name,
            subject: updateData.subject,
            fromName: updateData.fromName,
            replyTo: updateData.replyTo,
            contentBlocks: JSON.stringify(updateData.contentBlocks),
          },
        }
      );

      console.log('Update response:', res);

      if (res.response) {
        const updatedEmail = JSON.parse(res.response.body);
        console.log('Updated email:', updatedEmail);

        // Update the email in our local state
        setEmails((prevEmails) =>
          prevEmails.map((email) =>
            email.id === editingEmail.id ? { ...email, ...updatedEmail } : email
          )
        );

        Notification.success('Email updated successfully!');
        closeEditModal();
      }
    } catch (error) {
      console.error('Failed to update email:', error);
      Notification.error('Failed to update email. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      <Stack spacing="spacingL">
        <Heading>HubSpot Emails</Heading>

        {/* HubSpot Connection */}
        <Card>
          <Stack spacing="spacingM">
            <Heading as="h2">Fetch HubSpot Emails</Heading>
            <Stack spacing="spacingS">
              <Button variant="primary" onClick={fetchHubSpotEmails} isLoading={loading}>
                {loading ? 'Fetching...' : 'Fetch HubSpot Emails'}
              </Button>
              {connected && <Badge variant="positive">Connected to HubSpot</Badge>}
            </Stack>
          </Stack>
        </Card>

        {/* Display Emails */}
        {emails.length > 0 && (
          <Card>
            <Stack spacing="spacingM">
              <Heading as="h2">HubSpot Emails ({emails.length} total)</Heading>

              <div className={styles.emailGrid}>
                {emails.map((email) => (
                  <div key={email.id} className={styles.emailCard}>
                    <Stack spacing="spacingS">
                      <div className={styles.emailHeader}>
                        <div className={styles.emailContent}>
                          <Heading as="h3" className={styles.emailTitle}>
                            {email.name || 'Untitled Email'}
                          </Heading>
                          <p className={styles.emailSubject}>
                            Subject: {email.subject || 'No subject'}
                          </p>
                          {email.from?.fromName && (
                            <p className={styles.fromName}>From: {email.from.fromName}</p>
                          )}
                          {email.contentBlocks && email.contentBlocks.length > 0 && (
                            <p className={styles.contentInfo}>
                              ✓ {email.contentBlocks.length} content block
                              {email.contentBlocks.length !== 1 ? 's' : ''} (
                              {email.contentBlocks.reduce(
                                (total, block) => total + block.characterCount,
                                0
                              )}{' '}
                              characters)
                            </p>
                          )}
                        </div>
                        <div className={styles.emailActions}>
                          <div className={styles.badgeGroup}>
                            <Badge variant={email.state === 'PUBLISHED' ? 'positive' : 'secondary'}>
                              {email.state}
                            </Badge>
                            {email.type && (
                              <Badge variant="primary">{email.type.replace('_', ' ')}</Badge>
                            )}
                          </div>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openEditModal(email)}>
                            Edit
                          </Button>
                        </div>
                      </div>

                      <div className={styles.emailMeta}>
                        <div>
                          <strong>ID:</strong> {email.id}
                        </div>
                        <div>
                          <strong>Created:</strong> {new Date(email.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Updated:</strong> {new Date(email.updatedAt).toLocaleDateString()}
                        </div>
                        {email.from?.replyTo && (
                          <div>
                            <strong>Reply To:</strong> {email.from.replyTo}
                          </div>
                        )}
                      </div>
                    </Stack>
                  </div>
                ))}
              </div>
            </Stack>
          </Card>
        )}

        {/* No emails state */}
        {connected && emails.length === 0 && (
          <Card>
            <Stack spacing="spacingM" alignItems="center">
              <Heading as="h3">No Emails Found</Heading>
              <p>No marketing emails found in your HubSpot account.</p>
            </Stack>
          </Card>
        )}

        {/* Edit Email Modal */}
        {editingEmail && (
          <Modal isShown={true} onClose={closeEditModal} shouldCloseOnOverlayClick={true}>
            {() => (
              <Box className={styles.modalContainer}>
                {/* Header */}
                <Box padding="spacingXl" className={styles.modalHeader}>
                  <Flex flexDirection="column" gap="spacingXs">
                    <Heading as="h2" marginBottom="none" className={styles.modalTitle}>
                      Edit Email
                    </Heading>
                    <Box className={styles.modalSubtitle}>
                      {editingEmail.name || 'Untitled Email'}
                    </Box>
                  </Flex>
                </Box>

                {/* Form Content */}
                <Box padding="spacingXl" className={styles.modalContent}>
                  <Flex flexDirection="column" gap="spacingL">
                    <Flex flexDirection="column" gap="spacingXs">
                      <Box className={styles.fieldLabel}>Email Name</Box>
                      <TextInput
                        value={updateData.name}
                        onChange={(e) =>
                          setUpdateData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter a descriptive name for your email"
                        size="medium"
                      />
                    </Flex>

                    <Flex flexDirection="column" gap="spacingXs">
                      <Box className={styles.fieldLabel}>Subject Line</Box>
                      <TextInput
                        value={updateData.subject}
                        onChange={(e) =>
                          setUpdateData((prev) => ({ ...prev, subject: e.target.value }))
                        }
                        placeholder="What's your email about?"
                        size="medium"
                      />
                    </Flex>

                    <Flex flexDirection="column" gap="spacingXs">
                      <Box className={styles.fieldLabel}>From Name</Box>
                      <TextInput
                        value={updateData.fromName}
                        onChange={(e) =>
                          setUpdateData((prev) => ({ ...prev, fromName: e.target.value }))
                        }
                        placeholder="Your name or company"
                        size="medium"
                      />
                    </Flex>

                    <Flex flexDirection="column" gap="spacingXs">
                      <Box className={styles.fieldLabel}>Reply To Email</Box>
                      <TextInput
                        value={updateData.replyTo}
                        onChange={(e) =>
                          setUpdateData((prev) => ({ ...prev, replyTo: e.target.value }))
                        }
                        placeholder="reply@yourcompany.com"
                        type="email"
                        size="medium"
                      />
                    </Flex>

                    {/* Content Blocks - Now Editable */}
                    {editingEmail && getContentBlocks(editingEmail).length > 0 && (
                      <Box className={styles.contentBlockContainer}>
                        <Box className={styles.contentBlockTitle}>
                          Content Blocks ({getContentBlocks(editingEmail).length})
                        </Box>
                        <Flex flexDirection="column" gap="spacingM">
                          {getContentBlocks(editingEmail).map((block, index) => (
                            <Box key={block.widgetId} className={styles.blockCard}>
                              <Flex
                                justifyContent="space-between"
                                alignItems="center"
                                marginBottom="spacingS">
                                <Box className={styles.blockTitle}>{block.name}</Box>
                                <Flex gap="spacingXs">
                                  <Badge variant="secondary" size="small">
                                    {block.type}
                                  </Badge>
                                  <Badge variant="primary" size="small">
                                    {updateData.contentBlocks[block.widgetId]?.textNodes?.reduce(
                                      (total, node) => total + node.textContent.length,
                                      0
                                    ) || block.characterCount}{' '}
                                    chars
                                  </Badge>
                                </Flex>
                              </Flex>

                              {/* Individual Text Node Editing */}
                              <Flex flexDirection="column" gap="spacingM">
                                {updateData.contentBlocks[block.widgetId]?.textNodes?.map(
                                  (textNode, nodeIndex) => (
                                    <Box key={textNode.id} className={styles.textNodeCard}>
                                      <Flex flexDirection="column" gap="spacingXs">
                                        <Flex justifyContent="space-between" alignItems="center">
                                          <Box className={styles.textNodeTitle}>
                                            Text {nodeIndex + 1} ({textNode.tagName})
                                          </Box>
                                          <Badge variant="secondary" size="small">
                                            {textNode.textContent.length} chars
                                          </Badge>
                                        </Flex>
                                        <Textarea
                                          value={textNode.textContent}
                                          onChange={(e) =>
                                            updateTextNode(
                                              block.widgetId,
                                              textNode.id,
                                              e.target.value
                                            )
                                          }
                                          rows={2}
                                          placeholder={`Enter text content for ${textNode.tagName}...`}
                                          className={styles.textareaStyle}
                                        />
                                      </Flex>
                                    </Box>
                                  )
                                ) || (
                                  <Box className={styles.noContentMessage}>
                                    No text content found in this block
                                  </Box>
                                )}
                              </Flex>
                            </Box>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {/* Email Status Info */}
                    <Box padding="spacingM" className={styles.statusContainer}>
                      <Flex alignItems="center" gap="spacingM">
                        <Badge
                          variant={editingEmail.state === 'PUBLISHED' ? 'positive' : 'secondary'}>
                          {editingEmail.state}
                        </Badge>
                        <Box className={styles.statusText}>
                          Last updated: {new Date(editingEmail.updatedAt).toLocaleDateString()}
                        </Box>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>

                {/* Footer */}
                <Box padding="spacingXl" className={styles.modalFooter}>
                  <Flex justifyContent="flex-end" gap="spacingM">
                    <Button
                      variant="secondary"
                      onClick={closeEditModal}
                      isDisabled={updating}
                      size="medium">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={updateEmail}
                      isLoading={updating}
                      size="medium">
                      {updating ? 'Updating...' : 'Update Email'}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            )}
          </Modal>
        )}
      </Stack>
    </div>
  );
};

export default Page;
