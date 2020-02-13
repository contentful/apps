import { parameterDefinitions, toInputParameters } from "./parameters";

describe("parameters", () => {
  describe("toInputParameters", () => {
    it("handles lack of parameters", () => {
      const result = toInputParameters(parameterDefinitions, {});

      expect(result).toEqual({
        projectKey: "",
        clientId: "",
        clientSecret: "",
        apiEndpoint: "",
        authApiEndpoint: "",
        locale: ""
      });
    });

    it("resolves parameters to string values", () => {
      const result = toInputParameters(parameterDefinitions, {
        projectKey: "some-key",
        clientId: 12345,
        clientSecret: "some-secret",
        apiEndpoint: "some-endpoint",
        authApiEndpoint: "some-auth-endpoint",
        locale: "en"
      });

      expect(result).toEqual({
        projectKey: "some-key",
        clientId: "12345",
        clientSecret: "some-secret",
        apiEndpoint: "some-endpoint",
        authApiEndpoint: "some-auth-endpoint",
        locale: "en"
      });
    });
  });
});
