import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import InstalledServiceAccountKey from './InstalledServiceAccountKey';

export default {
  title: 'Components/InstalledServiceAccountKey',
  component: InstalledServiceAccountKey,
} as ComponentMeta<typeof InstalledServiceAccountKey>;

const mockAccountKey = {
  type: '',
  project_id: '',
  private_key_id: '',
  private_key: '',
  client_email: '',
  client_id: '',
  auth_uri: '',
  token_uri: '',
  auth_provider_x509_cert_url: '',
  client_x509_cert_url: '',
};

const mockAccountId = {
  id: '',
  clientEmail: '',
  projectId: '',
  clientId: '',
};

export const Primary: ComponentStory<typeof InstalledServiceAccountKey> = () => (
  <InstalledServiceAccountKey
    serviceAccountKey={mockAccountKey}
    serviceAccountKeyId={mockAccountId}
  />
);
