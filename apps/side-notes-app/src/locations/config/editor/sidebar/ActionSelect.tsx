import { Flex, FormControl, Select, Textarea } from '@contentful/f36-components';
import { useCMA } from '@contentful/react-apps-toolkit';
import { AppActionParameterDefinition } from 'contentful-management';
import { useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { PropType, WidgetTemplateProps } from '../../../../types/types';
import { WidgetEditorContext } from '../WidgetEditorContext';

const appActionParameterSamples = {
  ['Boolean']: false,
  ['Symbol']: 'sample text',
  ['Number']: 123,
  ['Enum']: 'enum value',
};

const buildSampleActionParameters = (parameters: AppActionParameterDefinition[]) => {
  return parameters.reduce(
    (acc, parameter) => ({
      ...acc,
      [parameter.id]: appActionParameterSamples[parameter.type],
    }),
    {}
  );
};

export const ActionSelect = ({
  propDef,
  setProp,
}: {
  propDef: WidgetTemplateProps;
  setProp: (key: string, value: string) => void;
}) => {
  const cma = useCMA();
  const { data } = useSWR('app-actions', () => cma.appAction.getManyForEnvironment({}));
  const { selectedElementObj, selectedElement, setElementByKey } = useContext(WidgetEditorContext);
  const selectedAction = useMemo(
    () => data && data.items.find((item) => item.sys.id === propDef.value?.split('.')[1]),
    [data, propDef]
  );

  const [stringifiedParameters, setStringifiedParameters] = useState(
    // @ts-expect-error
    propDef.parameters
  );

  useEffect(() => {
    // @ts-expect-error
    const propIndex = selectedElementObj.props.findIndex((prop) => prop.key === propDef.key);

    // @ts-expect-error
    const propElement = { ...selectedElementObj.props[propIndex] };
    if (propElement.type === PropType.ACTION_SELECT) {
      propElement.parameters = stringifiedParameters;
      // @ts-expect-error
      const propsCopy = [...selectedElementObj.props];
      propsCopy[propIndex] = propElement;
      const newObj = {
        ...selectedElementObj,
        props: propsCopy,
      };
      if (!selectedElement) return;
      // @ts-expect-error
      setElementByKey(selectedElement, newObj);
    }
  }, [stringifiedParameters]);

  useEffect(() => {
    // @ts-expect-error
    if (!selectedAction?.parameters || propDef.parameters !== '{}') return;
    setStringifiedParameters(
      // @ts-expect-error
      JSON.stringify(buildSampleActionParameters(selectedAction.parameters))
    );
  }, [selectedAction]);

  if (!data) return null;

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Select
        id="action-select"
        name="action-select"
        value={propDef.value}
        onChange={(e) => setProp(propDef.key, e.target.value)}>
        <Select.Option isDisabled value="">
          Select Action
        </Select.Option>
        {data.items.map((item) => {
          return (
            <Select.Option
              key={item.sys.id}
              value={`${item.sys.appDefinition.sys.id}.${item.sys.id}`}>
              {item.name}
            </Select.Option>
          );
        })}
      </Select>
      <FormControl.Label>Parameters</FormControl.Label>
      <Textarea
        value={stringifiedParameters}
        onChange={(e) => setStringifiedParameters(e.target.value)}
      />
    </Flex>
  );
};
