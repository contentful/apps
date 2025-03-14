import Field from './Field';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => ({ width: 100, height: 100 }),
  useFieldValue: () => ['', () => ''],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { items: [] } }),
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByTestId } = render(<Field />);

    expect(getByTestId('cf-ui-entry-card')).toBeInTheDocument();
  });
});
