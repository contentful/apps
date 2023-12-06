import { Textarea, TextInput } from '@contentful/f36-components';
import { PropType, WidgetTemplateProps } from '../../../../types/types';
import { ActionSelect } from './ActionSelect';
import { SidebarSelect } from './SidebarSelect';

export const SidebarRenderProp = ({
  propDef,
  setProp,
}: {
  propDef: WidgetTemplateProps;
  setProp: (key: string, value: string) => void;
}) => {
  switch (propDef.type) {
    case PropType.TEXT: {
      return (
        <TextInput value={propDef.value} onChange={(e) => setProp(propDef.key, e.target.value)} />
      );
    }
    case PropType.URL: {
      return (
        <TextInput value={propDef.value} onChange={(e) => setProp(propDef.key, e.target.value)} />
      );
    }
    case PropType.TEXTAREA: {
      return (
        <Textarea value={propDef.value} onChange={(e) => setProp(propDef.key, e.target.value)} />
      );
    }
    case PropType.DROPDOWN: {
      return <SidebarSelect propDef={propDef} setProp={setProp} />;
    }
    case PropType.ACTION_SELECT: {
      return <ActionSelect propDef={propDef} setProp={setProp} />;
    }
    default: {
      return null;
    }
  }
};
