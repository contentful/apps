import { css } from 'emotion';

export const styles = {
  actionItem: css({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    minHeight: '40px',
    whiteSpace: 'nowrap',
  }),
  advancedMatchingFields: css({
    alignItems: 'flex-start',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    width: '100%',
  }),
  advancedMatchingTopRow: css({
    alignItems: 'flex-start',
    display: 'flex',
    gap: '12px',
    width: '100%',
  }),
  advancedMatchingBottomRow: css({
    alignItems: 'flex-start',
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    width: '100%',
  }),
  contentTypeItem: css({
    flex: 4,
  }),
  advancedMatchingPanel: css({
    background: '#FCFDFD',
    border: '1px solid #E5EBED',
    borderRadius: '6px',
    marginTop: '4px',
    padding: '10px 12px 12px',
    width: '100%',
  }),
  advancedMatchingIntro: css({
    display: 'block',
    marginBottom: '12px',
  }),
  baseRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: '12px',
    width: '100%',
  }),
  removeItem: css({
    flex: 1.2,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    minHeight: '40px',
  }),
  statusItem: css({
    flex: 0.5,
  }),
  stackedField: css({
    flex: 1,
    minWidth: '220px',
  }),
  compactField: css({
    flex: 1,
    minWidth: '220px',
  }),
  tooltipIcon: css({
    alignItems: 'center',
    color: '#111B2B',
    display: 'inline-flex',
    lineHeight: 0,
    '& svg': {
      color: '#111B2B !important',
      fill: '#111B2B !important',
      height: '18px',
      width: '18px',
    },
  }),
  toggleItem: css({
    alignItems: 'center',
    display: 'flex',
    flex: 0.9,
    justifyContent: 'flex-start',
    minHeight: '40px',
    minWidth: '150px',
  }),
  urlPrefixItem: css({
    flex: 3,
  }),
};
