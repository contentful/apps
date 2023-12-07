import { WidgetTemplateProps } from '../types/types';
import { serializeText } from './serializeText';

export const serializeProps = (props: WidgetTemplateProps[], data?: any) => {
  return props.reduce((acc, prop) => {
    let val = prop.value;
    if (typeof val === 'string' && data) {
      val = serializeText(data, val);
    }
    return { ...acc, [prop.key]: val };
  }, {});
};
