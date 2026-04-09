import type { MappingReviewSuspendPayload, PreviewPayload } from '../types/workflow';

export const truncateLabel = (label: string, maxLength: number = 10): string => {
  if (label.length <= maxLength) return label;

  const halfLength = Math.floor(maxLength / 2);
  const firstHalf = label.slice(0, halfLength).trim();
  const secondHalf = label.slice(label.length - halfLength).trim();

  return `${firstHalf}...${secondHalf}`;
};

export const isMappingReviewSuspendPayload = (
  payload: PreviewPayload | MappingReviewSuspendPayload
): payload is MappingReviewSuspendPayload => {
  return 'suspendStepId' in payload && payload.suspendStepId === 'mapping-review';
};

export const isPreviewPayload = (
  payload: PreviewPayload | MappingReviewSuspendPayload
): payload is PreviewPayload => {
  return 'entries' in payload && 'referenceGraph' in payload;
};
