import { Select } from '@contentful/f36-components';
import { WidgetTemplateProps } from '../../../../types/types';

export const SidebarSelect = ({
  propDef,
  setProp,
}: {
  propDef: WidgetTemplateProps;
  setProp: (key: string, value: string) => void;
}) => {
  return (
    <Select
      id="optionSelect-controlled"
      name="optionSelect-controlled"
      value={propDef.value}
      onChange={(e) => setProp(propDef.key, e.target.value)}>
      {/* @ts-expect-error */}
      {propDef.options &&
        // @ts-expect-error
        propDef.options.map((option) => {
          return (
            <Select.Option key={option.key} value={option.key}>
              {option.title}
            </Select.Option>
          );
        })}
    </Select>
  );
};
