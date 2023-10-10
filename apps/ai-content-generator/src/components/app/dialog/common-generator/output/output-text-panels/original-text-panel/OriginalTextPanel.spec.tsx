import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AIMock, mockCma, MockSdk } from '@test/mocks';
import OriginalTextPanel from './OriginalTextPanel';
import { Tabs } from '@contentful/f36-components';
import { OutputTab } from '../../Output';
import featureConfig from '@configs/features/featureConfig';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

vi.mock('@utils/aiApi', () => AIMock);

describe('OriginalTextPanel', () => {
  it('renders', () => {
    const { getByText, unmount } = render(
      <Tabs currentTab={OutputTab.UPDATE_ORIGINAL_TEXT}>
        <OriginalTextPanel
          inputText=""
          generate={() => {}}
          isGenerating={false}
          outputFieldLocale="en-US"
          isNewText
          hasOutputField
          hasError={false}
          dialogText={featureConfig.content.dialogText}
        />
      </Tabs>
    );
    expect(getByText('Select an output field and enter a prompt to generate content')).toBeTruthy();
    unmount();
  });

  it('renders with input text', () => {
    const { getByText, unmount } = render(
      <Tabs currentTab={OutputTab.UPDATE_ORIGINAL_TEXT}>
        <OriginalTextPanel
          inputText="test"
          generate={() => {}}
          isGenerating={false}
          outputFieldLocale="en-US"
          isNewText
          hasOutputField
          hasError={false}
          dialogText={featureConfig.content.dialogText}
        />
      </Tabs>
    );
    expect(getByText('test')).toBeTruthy();
    unmount();
  });

  it('renders with error', () => {
    const { getByText, unmount } = render(
      <Tabs currentTab={OutputTab.UPDATE_ORIGINAL_TEXT}>
        <OriginalTextPanel
          inputText=""
          generate={() => {}}
          isGenerating={false}
          outputFieldLocale="en-US"
          isNewText
          hasOutputField
          hasError
          dialogText={featureConfig.content.dialogText}
        />
      </Tabs>
    );
    expect(getByText('No results were returned. Please try again.')).toBeTruthy();
    unmount();
  });

  it('renders openai token info when ready to generate', () => {
    const { getByText, unmount } = render(
      <Tabs currentTab={OutputTab.UPDATE_ORIGINAL_TEXT}>
        <OriginalTextPanel
          inputText="test"
          generate={() => {}}
          isGenerating={false}
          outputFieldLocale="en-US"
          isNewText
          hasOutputField
          hasError={false}
          dialogText={featureConfig.content.dialogText}
        />
      </Tabs>
    );
    expect(getByText('OpenAI tokens.')).toBeTruthy();
    unmount();
  });
});
