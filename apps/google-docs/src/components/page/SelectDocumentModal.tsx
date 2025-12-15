import React, { useEffect, useState } from 'react';
import { Box, Button, Modal, Note, Radio, Table } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

interface SelectDocumentModalProps {
  oauthToken: string;
  isOpen: boolean;
  onClose: (documentId?: string) => void;
}

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  owners?: { displayName: string; emailAddress: string }[];
}

async function listGoogleDocs(accessToken: string): Promise<GoogleDoc[]> {
  const q = "mimeType='application/vnd.google-apps.document' and trashed=false";

  const params = new URLSearchParams({
    q,
    spaces: 'drive',
    pageSize: '50',
    fields: 'files(id,name,owners(displayName,emailAddress),modifiedTime)',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.files as Array<{
    id: string;
    name: string;
    modifiedTime: string;
    owners?: { displayName: string; emailAddress: string }[];
  }>;
}

export default function SelectDocumentModal({
  oauthToken,
  isOpen,
  onClose,
}: SelectDocumentModalProps) {
  const [googleDocs, setGoogleDocs] = useState<GoogleDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoogleDocs = async () => {
      const docs = await listGoogleDocs(oauthToken);
      console.log('DOCS', docs);
      setGoogleDocs(docs);
    };
    fetchGoogleDocs();
  }, [oauthToken]);

  useEffect(() => {
    if (isOpen) {
      setSelectedDocId(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleCancel = () => {
    onClose();
  };

  const handleNext = () => {
    if (!selectedDocId) {
      setErrorMessage('Please select a document');
      return;
    }
    setErrorMessage(null);
    onClose(selectedDocId);
  };

  const handleRowClick = (docId: string) => {
    setSelectedDocId(docId);
    setErrorMessage(null);
  };

  return (
    <Modal onClose={handleCancel} isShown={isOpen} size="large">
      {() => (
        <>
          <Modal.Header title="Select Document" onClose={handleCancel} />
          <Modal.Content style={{ padding: 0 }}>
            <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table>
                <Table.Head
                  style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: tokens.colorWhite,
                    zIndex: 1,
                  }}>
                  <Table.Row>
                    <Table.Cell style={{ width: tokens.spacing2Xl, textAlign: 'center' }} />
                    <Table.Cell>Owner</Table.Cell>
                    <Table.Cell>Modified Time</Table.Cell>
                    <Table.Cell>Name</Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {googleDocs.map((doc) => (
                    <Table.Row
                      key={doc.id}
                      onClick={() => handleRowClick(doc.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedDocId === doc.id ? tokens.blue100 : undefined,
                      }}>
                      <Table.Cell
                        style={{
                          width: tokens.spacing2Xl,
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}>
                        <Radio
                          id={`doc-${doc.id}`}
                          name="document-selection"
                          isChecked={selectedDocId === doc.id}
                          onChange={() => handleRowClick(doc.id)}
                        />
                      </Table.Cell>
                      <Table.Cell>{doc.owners?.[0]?.displayName ?? 'Unknown'}</Table.Cell>
                      <Table.Cell>{new Date(doc.modifiedTime).toLocaleString()}</Table.Cell>
                      <Table.Cell>{doc.name}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Box>

            {errorMessage && (
              <Box padding="spacingM">
                <Note variant="negative">{errorMessage}</Note>
              </Box>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
