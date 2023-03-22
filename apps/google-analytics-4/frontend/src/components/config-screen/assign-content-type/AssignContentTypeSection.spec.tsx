import { render, screen } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../../test/mocks';
import AssignContentTypeSection from 'components/config-screen/assign-content-type/AssignContentTypeSection';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

jest.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Assign Content Type Section for Config Screen', () => {
  it('can render the section heading', () => {
    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={() => {}}
        parameters={{}}
        currentEditorInterface={{}}
        originalContentTypes={{}}
      />
    );

    expect(screen.getByText('Content type configuration')).toBeVisible();
  });
});
