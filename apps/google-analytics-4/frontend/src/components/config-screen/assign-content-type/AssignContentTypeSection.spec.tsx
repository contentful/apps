import { render, screen } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../../test/mocks';
import AssignContentTypeSection from './AssignContentTypeSection';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Assign Content Type Section for Config Screen', () => {
  it('can render the section heading and trailing slash checkbox', () => {
    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={() => {}}
        parameters={{}}
        currentEditorInterface={{}}
        originalContentTypes={{}}
      />
    );

    expect(screen.getByText('Content type configuration')).toBeDefined();
    expect(screen.getByText('Use trailing slash for all page paths')).toBeDefined();
  });
});
