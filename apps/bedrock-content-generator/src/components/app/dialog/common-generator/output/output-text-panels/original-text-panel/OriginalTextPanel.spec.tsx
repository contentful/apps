import featureConfig from "@configs/features/featureConfig";
import { Tabs } from "@contentful/f36-components";
import { AIMock, MockSdk, mockCma } from "@test/mocks";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OutputTab } from "../../Output";
import OriginalTextPanel from "./OriginalTextPanel";

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

vi.mock("@utils/aiApi", () => AIMock);

describe("OriginalTextPanel", () => {
  it("renders", () => {
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
      </Tabs>,
    );
    expect(
      getByText(
        "Select an output field and enter a prompt to generate content",
      ),
    ).toBeTruthy();
    unmount();
  });

  it("renders with input text", () => {
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
      </Tabs>,
    );
    expect(getByText("test")).toBeTruthy();
    unmount();
  });

  it("renders with error", () => {
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
          errorText="No results were returned. Please try again."
          dialogText={featureConfig.content.dialogText}
        />
      </Tabs>,
    );
    expect(
      getByText("No results were returned. Please try again."),
    ).toBeTruthy();
    unmount();
  });

  it("renders Bedrock token info when ready to generate", () => {
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
      </Tabs>,
    );
    expect(getByText("Amazon Bedrock charges.")).toBeTruthy();
    unmount();
  });
});
