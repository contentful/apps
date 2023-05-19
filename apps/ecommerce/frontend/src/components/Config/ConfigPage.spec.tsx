import { render, screen } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../test/mocks';
import ConfigPage from './ConfigPage';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Page component', () => {
  it('mounts', () => {
    render(<ConfigPage />);

    expect(screen.getByTestId('configPageBackground')).toBeInTheDocument();
  });
});
