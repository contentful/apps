import { enabledContentTypesToTargetState } from "./AppConfig";

describe("enabledContentTypesToTargetState", () => {
  const contentTypes = [
    {
      sys: {
        id: "page",
      },
    },
    {
      sys: {
        id: "seo",
      },
    },
  ];
  const enabledContentTypes = ["page"];
  describe("when the content type already has the app assigned", () => {
    it("does not overwrite the existing position", () => {
      const currentState = {
        EditorInterface: {
          page: {
            sidebar: {
              position: 6,
            },
          },
        },
      };
      const result = enabledContentTypesToTargetState(
        currentState,
        contentTypes,
        enabledContentTypes
      );
      expect(result.EditorInterface.page.sidebar.position).toEqual(6);
    });
  });
  describe("when the content type does not already have the app assigned", () => {
    it("sets Gatsby to position 3", () => {
      const currentState = { EditorInterface: {} };
      const result = enabledContentTypesToTargetState(
        currentState,
        contentTypes,
        enabledContentTypes
      );
      expect(result.EditorInterface.page.sidebar.position).toEqual(3);
    });
  });
});
