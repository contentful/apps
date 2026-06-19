import { WizardStep, type Wizard } from './AddEntryWizard';

interface WizardCtx {
  needsReferenceFieldStep: boolean;
}

interface StepDescriptor {
  next(state: Wizard, ctx: WizardCtx): WizardStep;
  back(state: Wizard, ctx: WizardCtx): WizardStep;
  isDisabled(state: Wizard): boolean;
}

export type { WizardCtx };

export const WIZARD_STEPS: Record<WizardStep, StepDescriptor> = {
  [WizardStep.ContentType]: {
    next: () => WizardStep.IsReference,
    back: (s) => s.step,
    isDisabled: (s) => !s.contentTypeId,
  },
  [WizardStep.IsReference]: {
    next: (s) => (s.isReference ? WizardStep.SelectReference : WizardStep.SelectFields),
    back: () => WizardStep.ContentType,
    isDisabled: (s) => s.isReference === null,
  },
  [WizardStep.SelectReference]: {
    next: (_, ctx) =>
      ctx.needsReferenceFieldStep ? WizardStep.SelectReferenceField : WizardStep.SelectFields,
    back: () => WizardStep.IsReference,
    isDisabled: (s) => !s.referenceEntryId,
  },
  [WizardStep.SelectReferenceField]: {
    next: () => WizardStep.SelectFields,
    back: () => WizardStep.SelectReference,
    isDisabled: (s) => !s.referenceFieldId,
  },
  [WizardStep.SelectFields]: {
    next: (s) => s.step,
    back: (s, ctx) =>
      s.isReference
        ? ctx.needsReferenceFieldStep
          ? WizardStep.SelectReferenceField
          : WizardStep.SelectReference
        : WizardStep.IsReference,
    isDisabled: () => false,
  },
};
