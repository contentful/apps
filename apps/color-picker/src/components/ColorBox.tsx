import { css } from 'emotion';
import { Color } from '../types';

const styles = {
  colorBox: (color: string) =>
    css({
      display: 'inline-block',
      width: '16px',
      height: '16px',
      boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
      backgroundColor: color,
      borderRadius: '4px',
    }),
};

interface Props {
  color?: string | Color;
}

export function ColorBox({ color }: Props) {
  return (
    <span
      className={styles.colorBox(
        (typeof color === 'string' ? color : color?.value) ?? '#ffffff',
      )}
    />
  );
}
