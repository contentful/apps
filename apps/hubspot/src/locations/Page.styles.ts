import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    padding: tokens.spacingXl,
    maxWidth: '1200px',
    margin: '0 auto',
  }),

  emailGrid: css({
    display: 'grid',
    gap: tokens.spacingM,
  }),

  emailCard: css({
    padding: tokens.spacingL,
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorWhite,
  }),

  emailHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }),

  emailContent: css({
    flex: 1,
  }),

  emailTitle: css({
    margin: 0,
    fontSize: tokens.fontSizeL,
  }),

  emailSubject: css({
    margin: `${tokens.spacingXs} 0`,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightMedium,
  }),

  fromName: css({
    margin: `${tokens.spacing2Xs} 0`,
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
  }),

  contentInfo: css({
    margin: `${tokens.spacing2Xs} 0`,
    fontSize: tokens.fontSizeS,
    color: tokens.green600,
  }),

  emailActions: css({
    display: 'flex',
    gap: tokens.spacingXs,
    flexDirection: 'column',
    alignItems: 'flex-end',
  }),

  badgeGroup: css({
    display: 'flex',
    gap: tokens.spacingXs,
  }),

  emailMeta: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingM,
    marginTop: tokens.spacingS,
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
  }),

  modalContainer: css({
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    backgroundColor: tokens.colorWhite,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),

  modalHeader: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    backgroundColor: tokens.gray100,
    flexShrink: 0,
  }),

  modalTitle: css({
    fontSize: tokens.fontSizeXl,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray900,
  }),

  modalSubtitle: css({
    color: tokens.gray600,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightNormal,
  }),

  modalContent: css({
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 200px)',
  }),

  modalFooter: css({
    borderTop: `1px solid ${tokens.gray300}`,
    backgroundColor: tokens.gray100,
    flexShrink: 0,
  }),

  fieldLabel: css({
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray700,
    marginBottom: tokens.spacingXs,
  }),

  textareaStyle: css({
    fontSize: tokens.fontSizeS,
    lineHeight: '1.5',
  }),

  contentBlockContainer: css({
    marginTop: tokens.spacingM,
    padding: tokens.spacingM,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray200}`,
  }),

  contentBlockTitle: css({
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray700,
    marginBottom: tokens.spacingS,
  }),

  blockCard: css({
    padding: tokens.spacingM,
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorWhite,
  }),

  blockTitle: css({
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray700,
  }),

  textNodeCard: css({
    padding: tokens.spacingS,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.gray200}`,
  }),

  textNodeTitle: css({
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray700,
  }),

  noContentMessage: css({
    padding: tokens.spacingS,
    textAlign: 'center',
    color: tokens.gray600,
    fontStyle: 'italic',
  }),

  statusContainer: css({
    backgroundColor: tokens.blue100,
    border: `1px solid ${tokens.blue300}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingXs,
  }),

  statusText: css({
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
  }),
};
