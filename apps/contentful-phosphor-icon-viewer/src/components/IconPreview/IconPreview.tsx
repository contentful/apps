import { Flex, Text, Badge, Box } from '@contentful/f36-components';
import { css } from 'emotion';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { IconFieldValue } from '../../types/icon';
import { ICON_WEIGHT_LABELS, ICON_POSITION_LABELS } from '../../types/icon';

const styles = {
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f7f9fa',
    borderRadius: '6px',
    border: '1px solid #e5e5e5',
  }),
  iconWrapper: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #e5e5e5',
  }),
  info: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }),
  name: css({
    fontWeight: 600,
    fontSize: '14px',
    color: '#192532',
  }),
};

interface IconPreviewProps {
  value: IconFieldValue;
}

export function IconPreview({ value }: IconPreviewProps) {
  const IconComponent = (
    PhosphorIcons as Record<string, React.ComponentType<{ size?: number; weight?: string }>>
  )[value.componentName];

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        {IconComponent ? (
          <IconComponent size={32} weight={value.weight} />
        ) : (
          <Text fontColor="gray500">?</Text>
        )}
      </div>
      <div className={styles.info}>
        <Text className={styles.name}>{value.name}</Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="secondary">Weight: {ICON_WEIGHT_LABELS[value.weight]}</Badge>
          <Badge variant="secondary">Position: {ICON_POSITION_LABELS[value.position]}</Badge>
        </div>
      </div>
    </div>
  );
}
