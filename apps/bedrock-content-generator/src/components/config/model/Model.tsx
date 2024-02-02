import HyperLink from '@components/common/HyperLink/HyperLink';
import { BedrockModel, defaultModelId, featuredModels } from '@configs/aws/featuredModels';
import {
  Flex,
  FormControl,
  Radio,
  Spinner,
  Stack,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon, WarningIcon } from '@contentful/f36-icons';
import AI from '@utils/aiApi';
import { Dispatch, useEffect, useMemo, useState } from 'react';
import { ConfigErrors, ModelText } from '../configText';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import s from './model.module.css';
import {
  modelForbiddenError,
  modelNotInAccountError,
  modelNotInRegionError,
  modelOtherError,
} from './modelErrors';

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

export type ModelAvailability =
  | 'AVAILABLE'
  | 'NOT_IN_REGION'
  | 'NOT_IN_ACCOUNT'
  | 'FORBIDDEN'
  | 'OTHER_ERROR';

interface ModelWithAvailability extends BedrockModel {
  availability: ModelAvailability;
  error?: Error;
}

const Model = ({ credentials, credentialsValid, model, modelValid, region, dispatch }: Props) => {
  const ai = useMemo(
    () =>
      credentialsValid && credentials.accessKeyID && credentials.secretAccessKey
        ? new AI(credentials.accessKeyID, credentials.secretAccessKey, region)
        : null,
    [credentials.accessKeyID, credentials.secretAccessKey, credentialsValid, region]
  );

  const [models, setModels] = useState<ModelWithAvailability[]>(
    featuredModels.map((m) => ({ ...m, availability: 'AVAILABLE' }))
  );
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const modelsNotInRegion = models.filter((m) => m.availability === 'NOT_IN_REGION');
  const modelsNotInAccount = models.filter((m) => m.availability === 'NOT_IN_ACCOUNT');
  const modelsWithForbiddenError = models.filter((m) => m.availability === 'FORBIDDEN');
  const modelsWithOtherError = models.filter((m) => m.availability === 'OTHER_ERROR');

  const setModel = (model: string, isValid: boolean) =>
    dispatch({ type: ParameterAction.UPDATE_MODEL, value: model, isValid });

  /** Fetch models */
  useEffect(() => {
    if (!ai) return;

    setIsFetchingModels(true);

    ai.getModels().then((allModels) => {
      const modelsWithRegionAvailability: ModelWithAvailability[] = featuredModels.map(
        (featuredModel) => {
          const isInRegion = allModels.some((m) => m.modelId === featuredModel.id);

          return {
            ...featuredModel,
            invokeCommand: featuredModel.invokeCommand,
            availability: isInRegion ? 'AVAILABLE' : 'NOT_IN_REGION',
          };
        }
      );

      const modelsWithAccountAvailability = modelsWithRegionAvailability.map(async (model) => {
        let availability = model.availability;
        let error: Error | undefined;
        if (model.availability === 'AVAILABLE') {
          const availabilityOrError = await ai.getModelAvailability(model);
          if (availabilityOrError instanceof Error) {
            availability = 'OTHER_ERROR';
            error = availabilityOrError;
          } else {
            availability = availabilityOrError;
          }
        }
        return {
          ...model,
          availability,
          error,
        } as ModelWithAvailability;
      });

      Promise.all(modelsWithAccountAvailability).then((models) => {
        setModels(models);
        setIsFetchingModels(false);
        if (!model) {
          const availableModel = models.find((m) => m.availability === 'AVAILABLE');
          if (availableModel) {
            setModel(availableModel.id, true);
          }
        }
      });
    });
  }, [ai, dispatch]);

  return (
    <FormControl isRequired marginBottom="none" isInvalid={!modelValid}>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Radio.Group
        name="permission"
        value={model}
        className={s.modelRadioGroup}
        onChange={(e) => {
          setModel(e.target.value, true);
        }}>
        {models.map((model) => (
          <Radio
            isDisabled={!ai || isFetchingModels || model.availability !== 'AVAILABLE'}
            key={model.id}
            value={model.id}
            className={s.modelRadio}>
            <Stack flexDirection="row" justifyContent="space-between" fullWidth>
              <p data-prefered={model.id == defaultModelId}>{model.name}</p>

              {model.availability == 'NOT_IN_ACCOUNT' && (
                <p className={s.modelRadioWarning}>
                  <WarningIcon /> Access not granted
                </p>
              )}
              {model.availability == 'NOT_IN_REGION' && <p>Not available in region</p>}
              {model.availability == 'FORBIDDEN' && <p>Access Forbidden</p>}
              {model.availability == 'OTHER_ERROR' && <p>Error accessing</p>}
            </Stack>
          </Radio>
        ))}
      </Radio.Group>

      <FormControl.HelpText>
        <HyperLink
          body={ModelText.helpText}
          substring={ModelText.linkSubstring}
          hyperLinkHref={ModelText.link}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </FormControl.HelpText>

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
          Open the{' '}
          <TextLink
            href={`https://${region}.console.aws.amazon.com/bedrock/home?region=${region}#/modelaccess`}>
            AWS Console
          </TextLink>{' '}
          to request access.
        </FormControl.ValidationMessage>
      )}
      {modelsWithForbiddenError.length > 0 && (
        <FormControl.ValidationMessage className={s.validationWarning}>
          {modelForbiddenError(modelsWithForbiddenError)}
          Check the instructions on top of this page to make sure you have set up your IAM user
          correctly.
        </FormControl.ValidationMessage>
      )}
      {modelsWithOtherError.length > 0 && (
        <FormControl.ValidationMessage className={s.validationWarning}>
          {modelOtherError(modelsWithOtherError)}
          {modelsWithOtherError[0].error?.name}: {modelsWithOtherError[0].error?.message}
        </FormControl.ValidationMessage>
      )}

      {!modelValid && (
        <FormControl.ValidationMessage>{ConfigErrors.missingModel}</FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Model;
