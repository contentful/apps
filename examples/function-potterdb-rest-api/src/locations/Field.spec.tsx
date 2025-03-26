import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => ({ width: 100, height: 100 }),
  useFieldValue: () => ['', vi.fn()],
}));
const mockCharacter = {
  slug: 'some-slug',
  name: '',
  gender: '',
  born: '',
  species: '',
  nationality: '',
  house: '',
  image: '',
  familyMembers: [''],
  aliasNames: [''],
  titles: [''],
  jobs: [''],
  wiki: '',
};
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      character: mockCharacter,
    },
    setValue: vi.fn(),
  }),
}));
describe('Field component', () => {
  it('Component text exists', () => {
    const { getByTestId } = render(<Field />);

    expect(getByTestId('cf-ui-entry-card')).toBeInTheDocument();
  });
});
