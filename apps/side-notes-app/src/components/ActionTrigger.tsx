import { Button } from '@contentful/f36-components';
import { useCMA } from '@contentful/react-apps-toolkit';
import { WidgetElementDefinition } from '../types/types';
import { serializeProps } from './utils';

export const ActionTrigger = ({
  widgetDef,
  content,
}: {
  widgetDef: WidgetElementDefinition;
  content: string;
}) => {
  const cma = useCMA();

  // Todo app action calls are currently not working
  const callAction = async () => {
    const actionProp = widgetDef.props.find((prop) => prop.key === 'actionId');
    if (!actionProp || !actionProp.value) return;
    const [appDefinitionId, appActionId] = actionProp.value.split('.');

    await cma.appActionCall.create(
      { appActionId, appDefinitionId },
      // @ts-expect-error
      { parameters: JSON.parse(actionProp.parameters) }
    );
  };
  return (
    <Button {...serializeProps(widgetDef.props)} onClick={callAction}>
      {content}
    </Button>
  );
};
