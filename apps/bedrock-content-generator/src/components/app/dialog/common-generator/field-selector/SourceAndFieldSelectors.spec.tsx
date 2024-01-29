import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '@test/mocks';
import SourceAndFieldSelectors from './SourceAndFieldSelectors';
import { GeneratorParameters } from '../generatorReducer';
import { SupportedFieldTypes } from '@hooks/dialog/useSupportedFields';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
  useSupportedFields: () => ({
    supportedFieldsWithContent: [],
    allSupportedFields: [],
  }),
  useContext: () => ({
    entryId: '',
    dispatch: vi.fn(),
    fieldLocales: [],
    localeNames: ['Dog', 'Cat'],
    defaultLocale: '',
  }),
}));

const parameters: GeneratorParameters = {
  isNewText: true,
  sourceField: '',
  originalText: {
    prompt: '',
    field: '',
  },
  output: {
    fieldId: '',
    fieldKey: '',
    locale: '',
    validation: null,
  },
  canGenerateTextFromField: false,
};

describe('Source And Field Selectors', () => {
  it('renders', () => {
    const { getByText, unmount } = render(
      <SourceAndFieldSelectors
        parameters={parameters}
        fieldTypes={[SupportedFieldTypes.RICH_TEXT]}
      />
    );
    expect(getByText('Content source')).toBeTruthy();
    unmount();
  });

  it('Does not render source field when from prompt', () => {
    const { getByText } = render(
      <SourceAndFieldSelectors
        parameters={{ ...parameters, isNewText: false }}
        fieldTypes={[SupportedFieldTypes.RICH_TEXT]}
      />
    );

    expect(getByText('Source field')).toBeTruthy();
  });
});
