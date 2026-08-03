import HyperLink from '@components/common/HyperLink/HyperLink';
import { defaultModelId, featuredModels } from '@configs/aws/featuredModels';
import { FormControl, Radio, Stack } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Dispatch } from 'react';
import { ConfigErrors, ModelText } from '../configText';
import { ParameterAction, ParameterReducer } from '../parameterReducer';
import s from './model.module.css';

interface Props {
  model: string;
  modelValid: boolean;
  dispatch: Dispatch<ParameterReducer>;
}

export type ModelAvailability =
  | 'AVAILABLE'
  | 'NOT_IN_REGION'
  | 'NOT_IN_ACCOUNT'
  | 'FORBIDDEN'
  | 'OTHER_ERROR';

const Model = ({ model, modelValid, dispatch }: Props) => {
  const setModel = (modelId: string, isValid: boolean) =>
    dispatch({ type: ParameterAction.UPDATE_MODEL, value: modelId, isValid });

  return (
    <FormControl isRequired marginBottom="none" isInvalid={!modelValid}>
      <FormControl.Label>{ModelText.title}</FormControl.Label>
      <Radio.Group
        name="permission"
        value={model}
        className={s.modelRadioGroup}
        onChange={(e) => setModel(e.target.value, true)}>
        {featuredModels.map((m) => (
          <Radio key={m.id} value={m.id} className={s.modelRadio}>
            <Stack flexDirection="row" justifyContent="space-between" fullWidth>
              <p data-prefered={m.id === defaultModelId}>{m.name}</p>
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

      {!modelValid && (
        <FormControl.ValidationMessage>{ConfigErrors.missingModel}</FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Model;
