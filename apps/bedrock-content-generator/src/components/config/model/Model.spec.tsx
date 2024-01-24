import { render, waitFor } from "@testing-library/react";
import AI from "@utils/aiApi";
import { Mock, describe, expect, it, vi } from "vitest";
import Model from "./Model";

vi.mock("@utils/aiApi", async () => ({
  default: vi.fn(),
}));

const AIMock = AI as Mock;

describe("Display Model", () => {
  it("renders", async () => {
    AIMock.mockImplementation(() => {
      return {
        getModels: vi.fn().mockResolvedValue([
          {
            modelId: "anthropic.claude-v2:1",
          },
          {
            modelId: "anthropic.claude-instant-v1",
          },
          {
            modelId: "meta.llama2-70b-chat-v1",
          },
        ]),
        getModelAvailability: vi.fn().mockResolvedValue("AVAILABLE"),
      };
    });

    const { getByText, unmount } = render(
      <Model
        model={""}
        modelValid={false}
        dispatch={() => ""}
        region={"abc"}
        credentials={{
          accessKeyID: "abc",
          secretAccessKey: "abc",
        }}
        credentialsValid={true}
      />,
    );
    await waitFor(() => {
      expect(getByText("Anthropic Claude v2.1")).toBeTruthy();
    });
    expect(getByText("Anthropic Claude Instant v1.2")).toBeTruthy();
    expect(getByText("Meta Llama 2 70B")).toBeTruthy();
    unmount();
  });
  it("displays errors", async () => {
    AIMock.mockImplementation(() => {
      return {
        getModels: vi.fn().mockResolvedValue([
          {
            modelId: "anthropic.claude-v2:1",
          },
          {
            modelId: "anthropic.claude-instant-v1",
          },
        ]),
        getModelAvailability: vi
          .fn()
          .mockResolvedValueOnce("AVAILABLE")
          .mockResolvedValueOnce("NOT_IN_ACCOUNT"),
      };
    });
    const { getByText, unmount, findByText } = render(
      <Model
        model={""}
        modelValid={false}
        dispatch={() => ""}
        region={"abc"}
        credentials={{
          accessKeyID: "abc",
          secretAccessKey: "abc",
        }}
        credentialsValid={true}
      />,
    );
    await waitFor(() => {
      expect(getByText("Anthropic Claude v2.1")).toBeTruthy();
    });
    expect(
      getByText(
        "The model Meta Llama 2 70B is not available in the abc region.",
      ),
    ).toBeTruthy();
    expect(
      findByText(
        "The model Anthropic Claude Instant v1.2 has not been granted access in your account.",
      ),
    ).toBeTruthy();
    unmount();
  });
});
