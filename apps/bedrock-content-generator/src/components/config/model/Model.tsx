import {
  Flex,
  FormControl,
  Select,
  Spinner,
  TextLink,
  Text,
} from "@contentful/f36-components";
import AI from "@utils/aiApi";
import { ChangeEvent, Dispatch, useEffect, useMemo, useState } from "react";
import { ConfigErrors, ModelText } from "../configText";
import { ParameterAction, ParameterReducer } from "../parameterReducer";
import { featuredModels } from "@configs/aws/featuredModels";
import s from "./Model.module.css";
import { modelNotInAccountError, modelNotInRegionError } from "./modelErrors";

interface Props {
  model: string;
  modelValid: boolean;
  dispatch: Dispatch<ParameterReducer>;
  region: string;
  credentials: {
    accessKeyID: string;
    secretAccessKey: string;
  };
  credentialsValid: boolean;
}

interface ModelWithAvailability {
  id: string;
  name: string;
  availability: "AVAILABLE" | "NOT_IN_REGION" | "NOT_IN_ACCOUNT";
}

const Model = ({
  credentials,
  credentialsValid,
  model,
  modelValid,
  region,
  dispatch,
}: Props) => {
  const ai = useMemo(
    () =>
      credentialsValid && credentials.accessKeyID && credentials.secretAccessKey
        ? new AI(credentials.accessKeyID, credentials.secretAccessKey, region)
        : null,
    [
      credentials.accessKeyID,
      credentials.secretAccessKey,
      credentialsValid,
      region,
    ],
  );

  const [models, setModels] = useState<ModelWithAvailability[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const modelsNotInRegion = models.filter(
    (m) => m.availability === "NOT_IN_REGION",
  );
  const modelsNotInAccount = models.filter(
    (m) => m.availability === "NOT_IN_ACCOUNT",
  );

  /** Fetch models */
  useEffect(() => {
    if (!ai) return;

    setIsFetchingModels(true);

    ai.getModels().then((allModels) => {
      const modelsWithRegionAvailability = featuredModels.map(
        (featuredModel) => {
          const isInRegion = allModels.some(
            (m) => m.modelId === featuredModel.id,
          );

          return {
            ...featuredModel,
            availability: isInRegion ? "AVAILABLE" : "NOT_IN_REGION",
          };
        },
      );

      const modelsWithAccountAvailability = modelsWithRegionAvailability.map(
        async (model) => {
          let availability = model.availability;
          if (model.availability === "AVAILABLE") {
            const isAvailableInAccount = await ai.isModelAvailable(model.id);
            availability = isAvailableInAccount
              ? availability
              : "NOT_IN_ACCOUNT";
          }
          return {
            ...model,
            availability,
          } as ModelWithAvailability;
        },
      );

      Promise.all(modelsWithAccountAvailability).then((models) => {
        setModels(models);
        setIsFetchingModels(false);
      });
    });
  }, [ai]);

  const modelList = models.map((model) => (
    <Select.Option
      key={model.id}
      value={model.id}
      isDisabled={model.availability != "AVAILABLE"}
    >
      {model.name}
    </Select.Option>
  ));

  /** Validate model selection. We need to do this here, because validity can change if e.g. region changes */
  useEffect(() => {
    if (model == "" || models.length == 0) return;

    const isSelectionValid = models.some(
      (m) => m.availability === "AVAILABLE" && m.id === model,
    );

    if (isSelectionValid) return;

    dispatch({
      type: ParameterAction.UPDATE_MODEL,
      value: model,
      isValid: false,
    });
  }, [model, models, dispatch]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) =>
    dispatch({
      type: ParameterAction.UPDATE_MODEL,
      value: e.target.value,
      isValid: true,
    });

  return (
    <FormControl isRequired marginBottom="none" isInvalid={!modelValid}>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Select
        value={model}
        onChange={handleChange}
        isDisabled={
          models.length < 1 ||
          models.find((m) => m.availability === "AVAILABLE") === undefined ||
          isFetchingModels
        }
      >
        {modelList}
      </Select>

      <FormControl.HelpText>{ModelText.helpText}</FormControl.HelpText>

      {isFetchingModels && (
        <Flex marginTop="spacingXs">
          <Text marginRight="spacingXs">Loading Model Availability</Text>
          <Spinner />
        </Flex>
      )}

      {modelsNotInRegion.length > 0 && (
        <FormControl.ValidationMessage className={s.validationWarning}>
          {modelNotInRegionError(modelsNotInRegion, region)}
        </FormControl.ValidationMessage>
      )}

      {modelsNotInAccount.length > 0 && (
        <FormControl.ValidationMessage className={s.validationWarning}>
          {modelNotInAccountError(modelsNotInAccount)}
          Open the{" "}
          <TextLink
            href={`https://${region}.console.aws.amazon.com/bedrock/home?region=${region}#/modelaccess`}
          >
            AWS Console
          </TextLink>{" "}
          to request access.
        </FormControl.ValidationMessage>
      )}

      {!modelValid && (
        <FormControl.ValidationMessage>
          {ConfigErrors.missingModel}
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Model;
