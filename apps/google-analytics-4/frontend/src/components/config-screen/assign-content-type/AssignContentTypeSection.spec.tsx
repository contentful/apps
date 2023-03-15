import { render, screen } from '@testing-library/react';
import { mockSdk } from '../../../../test/mocks';
import AssignContentTypeSection from 'components/config-screen/assign-content-type/AssignContentTypeSection';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Assign Content Type Section for Config Screen', () => {
  it('can render the section heading', () => {
    render(<AssignContentTypeSection />);

    expect(screen.getByText('Assign to content types')).toBeVisible();
  });
});
