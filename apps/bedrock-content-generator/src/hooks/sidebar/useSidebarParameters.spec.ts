import AppInstallationParameters from "@components/config/appInstallationParameters";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MockSdk,
  generateRandomParameters,
  mockCma,
  mockSdkParameters,
} from "../../../test/mocks";
import useSidebarParameters from "./useSidebarParameters";

const mockSdk = new MockSdk({ installation: mockSdkParameters.happyPath });
const sdk = mockSdk.sdk;

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe("useSidebarParameters", () => {
  it("should return whether there is a brand profile and any errors", async () => {
    const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
    sdk.parameters.installation = generateRandomParameters();
    const { result } = renderHook(() => useSidebarParameters());

    await waitFor(() => {
      expect(result.current).toHaveProperty("hasBrandProfile", true);
      expect(result.current).toHaveProperty("apiError", undefined);
    });
  });
});
