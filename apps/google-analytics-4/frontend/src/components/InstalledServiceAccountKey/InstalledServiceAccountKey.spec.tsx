import React from 'react';
import { act, render, screen } from '@testing-library/react';
import InstalledServiceAccountKey from './InstalledServiceAccountKey';
import { mockCma, mockSdk, validServiceKeyFile } from '../../../test/mocks';

import type { ServiceAccountKeyId } from '../../types';

const validServiceKeyId: ServiceAccountKeyId = {
  id: validServiceKeyFile.private_key_id,
  clientId: validServiceKeyFile.client_id,
  clientEmail: validServiceKeyFile.client_id,
  projectId: validServiceKeyFile.project_id,
};

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('InstalledServiceAccountKey', () => {
  it('can render the basic form', async () => {
    await act(async () => {
      render(
        <InstalledServiceAccountKey
          serviceAccountKeyId={validServiceKeyId}
          serviceAccountKey={validServiceKeyFile}
        />
      );
    });

    expect(screen.getByText('Installed Google Service Account Key')).toBeInTheDocument();
  });
});
