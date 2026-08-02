# Bedrock Content Generator — Move IAM Credentials to Secret Params [AIS-296] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove long-lived AWS IAM credentials from the browser in `bedrock-content-generator` by storing them as Contentful **Secret** installation parameters and proxying all Bedrock calls through a Contentful Function (App Action), exactly mirroring the merged OpenAI pattern (PR #11202 / AIS-295).

**Architecture:** The `fix/bedrock-secret-param-ais-296` branch already added the server-side half — a SigV4-signing `functions/bedrock-proxy.ts` and a `contentful-app-manifest.json` App Action, with `useAI.tsx` rewired to call `sdk.cma.appActionCall.createWithResponse`. This plan fills the remaining gaps: (1) flatten installation parameters to scalars so a `Secret` declaration passes Contentful's strict `additionalProperties:false` validation, (2) make credential inputs write-only, (3) delete the now-orphaned browser-side `AI` client (the exact file the SAST ticket cites), (4) update all test mocks to the flat shape, and (5) wire the function build + App-Action deploy pipeline.

**Tech Stack:** TypeScript, React 18, Contentful App SDK / react-apps-toolkit, Contentful Functions (`@contentful/node-apps-toolkit`), `@contentful/app-scripts`, Vitest, Forma 36.

## Global Constraints

- **Base branch:** `fix/bedrock-secret-param-ais-296` (matches the ticket ID). Do all work here.
- **App directory:** all paths are relative to `apps/bedrock-content-generator/`.
- **Reference pattern:** OpenAI PR #11202 (`apps/ai-content-generator/`). When in doubt, match it.
- **Do NOT port flat-params' `useAI.tsx`** — it still calls the vulnerable `AI` client. Keep 296's App-Action-based `useAI.tsx` as-is.
- **The two secrets are `accessKeyId` and `secretAccessKey`** (analogous to OpenAI's single `key`). `region` stays a plain Symbol.
- **`enabledFeatures` is JSON-encoded into a Symbol string** in the persisted shape (arrays are not scalar installation params).
- **Write-only rule:** only persist a secret when the admin enters a new value; omit it otherwise so a blank input never clobbers the stored Secret.
- **Verification per group:** `npx tsc --noEmit` clean, `npx vitest run` green, `npm run lint` (0 warnings). Use `vitest run` (non-watch) — `npm test` runs in watch mode and hangs.
- **Conventional commits**, ending with the `Co-Authored-By` trailer already used on the branch.
- **Out of code (manual, tracked in PR body):** the AppDefinition must declare `accessKeyId` and `secretAccessKey` as `"type": "Secret"` before deploy, or the keys remain plaintext in the browser even after this lands.

---

## File Structure

**Already present on the branch (do not recreate):**
- `functions/bedrock-proxy.ts` — SigV4-signed Bedrock InvokeModel proxy. ✅
- `functions/tsconfig.json` — extends `@tsconfig/recommended`. ✅
- `contentful-app-manifest.json` — `bedrockProxyFunction` + `bedrockProxyAction`. ✅
- `src/hooks/dialog/useAI.tsx` — App-Action-based; ✅ keep as-is.
- `src/components/config/model/Model.tsx` — static model list; ✅ keep as-is.

**Modified in this plan:**
- `src/components/config/appInstallationParameters.ts` — add `PersistedInstallationParameters` flat type.
- `src/components/config/parameterReducer.ts` — reference persisted type; JSON-decode `enabledFeatures` in `APPLY_CONTENTFUL_PARAMETERS`.
- `src/components/config/config-page/ConfigPage.tsx` — write-only credential inputs; flat `parametersToSave`; JSON-encode `enabledFeatures`.
- `src/components/config/config-section/ConfigSection.tsx` — thread write-only props; drop stale `Model` credential props.
- `src/components/config/access-key/AccessKey.tsx` — write-only inputs.
- `src/hooks/config/useInitializeParameters.ts` — read `PersistedInstallationParameters`.
- `src/hooks/config/useSaveConfigHandler.ts` — accept `PersistedInstallationParameters`; `validateParams` takes no args.
- `src/hooks/sidebar/useSidebarParameters.ts` — read flat shape; JSON-decode `enabledFeatures`.
- `src/hooks/dialog/useDialogParameters.ts` — type as `PersistedInstallationParameters`.
- `package.json` — function build + `upsert-actions` deploy wiring, `@contentful/node-apps-toolkit`, `@tsconfig/recommended`.
- `test/mocks/sdk/parameters/happyPathParameter.ts`, `initParameters.ts`, `test/mocks/sdk/utils/generateRandomParameters.ts`, `test/mocks/sdk/utils/createSdk.ts`, `test/mocks/sdk/mockSdk.ts` — flat shape.
- `test/mocks/index.ts` — drop `AIMock` export.

**Deleted in this plan:**
- `src/utils/aiApi/index.ts` — the browser-side `BedrockClient`/`BedrockRuntimeClient` (the SAST finding).
- `src/utils/aiApi/index.spec.ts`, `src/utils/aiApi/handleAiApiErrors.ts` — orphaned with it.
- `test/mocks/AiMock.ts` — orphaned mock.

---

## Task 1: Flatten the installation parameter type

**Files:**
- Modify: `src/components/config/appInstallationParameters.ts`

**Interfaces:**
- Consumes: existing `ProfileFields` enum, `ProfileType`, `AIFeature`.
- Produces: `PersistedInstallationParameters` — the flat scalar shape read from / written to Contentful. Shape:
  ```ts
  type PersistedInstallationParameters = {
    accessKeyId?: string;
    secretAccessKey?: string;
    region: string;
    model: string;
    enabledFeatures?: string; // JSON-encoded AIFeature[]
  } & ProfileType;
  ```
  `AppInstallationParameters` (the nested UI-side interface) stays the default export, unchanged.

- [ ] **Step 1: Add the `PersistedInstallationParameters` type**

Append to `src/components/config/appInstallationParameters.ts`, immediately before the `export default AppInstallationParameters;` line:

```ts
/**
 * The shape actually persisted to (and read from) Contentful installation
 * parameters. It is flat because installation parameter definitions only
 * support scalar types (Symbol/Enum/Number/Boolean/Secret) — there is no
 * object type, and declaring the Secret credentials opts the whole object into
 * strict `additionalProperties: false` validation. The nested `brandProfile`
 * used by the config UI is flattened into top-level ProfileType fields here.
 * `enabledFeatures` is JSON-encoded as a Symbol (array not supported).
 *
 * Every field below must have a matching parameter definition declared on the
 * AppDefinition (`accessKeyId` and `secretAccessKey` as Secret, the rest as
 * Symbol) or saves are rejected.
 */
export type PersistedInstallationParameters = {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  model: string;
  enabledFeatures?: string;
} & ProfileType;
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: PASS (this is an additive export; nothing consumes it yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/config/appInstallationParameters.ts
git commit -m "feat: add flat PersistedInstallationParameters type for bedrock secrets [AIS-296]"
```

---

## Task 2: Rehydrate flat params in the reducer

**Files:**
- Modify: `src/components/config/parameterReducer.ts`

**Interfaces:**
- Consumes: `PersistedInstallationParameters` (Task 1), `AIFeature`, `featureConfig`.
- Produces: `ParameterObjectActions.value` is now typed `PersistedInstallationParameters`; the `APPLY_CONTENTFUL_PARAMETERS` case reads flat fields and JSON-decodes `enabledFeatures`.

- [ ] **Step 1: Update imports**

Replace the first import line in `src/components/config/parameterReducer.ts`:

```ts
import AppInstallationParameters, {
  PersistedInstallationParameters,
} from './appInstallationParameters';
```

- [ ] **Step 2: Retype the apply action**

Change `ParameterObjectActions` so its `value` uses the persisted shape:

```ts
type ParameterObjectActions = {
  type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS;
  value: PersistedInstallationParameters;
};
```

- [ ] **Step 3: Rewrite the `APPLY_CONTENTFUL_PARAMETERS` case**

Replace the entire `case ParameterAction.APPLY_CONTENTFUL_PARAMETERS: { ... }` block with:

```ts
    case ParameterAction.APPLY_CONTENTFUL_PARAMETERS: {
      // Persisted params are flat (see PersistedInstallationParameters); rehydrate
      // the nested brandProfile shape the config UI reducer works with.
      // enabledFeatures is JSON-encoded as a Symbol string.
      const parameter = action.value;
      let enabledFeatures: AIFeature[];
      try {
        enabledFeatures = parameter.enabledFeatures
          ? JSON.parse(parameter.enabledFeatures)
          : (Object.keys(featureConfig) as AIFeature[]);
      } catch {
        enabledFeatures = Object.keys(featureConfig) as AIFeature[];
      }
      return {
        ...state,
        accessKeyId: {
          value: parameter.accessKeyId || '',
          isValid: (parameter.accessKeyId?.length ?? 0) > 0,
        },
        secretAccessKey: {
          value: parameter.secretAccessKey || '',
          isValid: (parameter.secretAccessKey?.length ?? 0) > 0,
        },
        model: {
          value: parameter.model,
          isValid: parameter.model?.length > 0,
        },
        profile: {
          value: parameter.profile || '',
          isValid: true,
        },
        brandProfile: {
          values: { value: parameter.values || '', isValid: true },
          tone: { value: parameter.tone || '', isValid: true },
          exclude: { value: parameter.exclude || '', isValid: true },
          include: { value: parameter.include || '', isValid: true },
          audience: { value: parameter.audience || '', isValid: true },
          additional: { value: parameter.additional || '', isValid: true },
        },
        enabledFeatures: {
          value: enabledFeatures,
          isValid: true,
        },
        region: {
          value: parameter.region,
          isValid: parameter.region?.length > 0,
        },
      };
    }
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/config/parameterReducer.ts
git commit -m "feat: rehydrate flat installation params in reducer [AIS-296]"
```

---

## Task 3: Make credential inputs write-only

**Files:**
- Modify: `src/components/config/access-key/AccessKey.tsx`

**Interfaces:**
- Consumes: `AccessKeyText` config strings, `HyperLink`, `ParameterReducer` (for the `dispatch` prop kept for signature compatibility with `ConfigSection`).
- Produces: `AccessKey` now takes write-only props: `accessKeyIdInput: string`, `secretAccessKeyInput: string`, `onAccessKeyIdChange: (v: string) => void`, `onSecretAccessKeyChange: (v: string) => void`. It no longer dispatches credential updates or reads stored credential values back.

- [ ] **Step 1: Replace the component with the write-only version**

Overwrite `src/components/config/access-key/AccessKey.tsx` with:

```tsx
import HyperLink from '@components/common/HyperLink/HyperLink';
import { FormControl, TextInput } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ChangeEvent, Dispatch } from 'react';
import { AccessKeyText } from '../configText';
import { ParameterReducer } from '../parameterReducer';

interface Props {
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  isInvalid: boolean;
  accessKeyIdInput: string;
  secretAccessKeyInput: string;
  onAccessKeyIdChange: (value: string) => void;
  onSecretAccessKeyChange: (value: string) => void;
  dispatch: Dispatch<ParameterReducer>;
}

const AccessKey = ({
  accessKeyIdInput,
  secretAccessKeyInput,
  onAccessKeyIdChange,
  onSecretAccessKeyChange,
}: Props) => {
  return (
    <>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.accessKeyIDTitle}</FormControl.Label>
        <TextInput
          value={accessKeyIdInput}
          type="text"
          name="accessKeyID"
          placeholder="Enter new Access Key ID (leave blank to keep existing)"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onAccessKeyIdChange(e.target.value)}
        />
      </FormControl>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.secretAccessKeyTitle}</FormControl.Label>
        <TextInput
          value={secretAccessKeyInput}
          type="password"
          name="secretAccessKey"
          placeholder="Enter new Secret Access Key (leave blank to keep existing)"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSecretAccessKeyChange(e.target.value)}
        />
        <FormControl.HelpText>
          <HyperLink
            body={AccessKeyText.helpText}
            substring={AccessKeyText.linkSubstring}
            hyperLinkHref={AccessKeyText.link}
            icon={<ExternalLinkIcon />}
            alignIcon="end"
          />
        </FormControl.HelpText>
      </FormControl>
    </>
  );
};

export default AccessKey;
```

- [ ] **Step 2: Verify (will not compile standalone yet)**

Run: `npx tsc --noEmit`
Expected: FAIL — `ConfigSection` still renders `AccessKey` without the new props. This is expected; Task 4 fixes the caller. Do not commit yet.

---

## Task 4: Thread write-only props through ConfigSection and ConfigPage

**Files:**
- Modify: `src/components/config/config-section/ConfigSection.tsx`
- Modify: `src/components/config/config-page/ConfigPage.tsx`

**Interfaces:**
- Consumes: write-only `AccessKey` (Task 3), `PersistedInstallationParameters` (Task 1), static `Model` (already on branch — takes only `model`, `modelValid`, `dispatch`).
- Produces: `ConfigPage` builds a flat `PersistedInstallationParameters` from local `useState` for the two secret inputs; `validateParams` takes no arguments.

- [ ] **Step 1: Rewrite ConfigSection**

Overwrite `src/components/config/config-section/ConfigSection.tsx` with:

```tsx
import { Box, Flex, Form, Subheading } from '@contentful/f36-components';
import { Dispatch } from 'react';
import AccessKey from '../access-key/AccessKey';
import { Sections } from '../configText';
import Model from '../model/Model';
import { ParameterReducer } from '../parameterReducer';
import Region from '../region/Region';

interface Props {
  accessKeyID: string;
  secretAccessKey: string;
  isAccessKeyValid: boolean;
  region: string;
  model: string;
  modelValid: boolean;
  accessKeyIdInput: string;
  secretAccessKeyInput: string;
  onAccessKeyIdChange: (value: string) => void;
  onSecretAccessKeyChange: (value: string) => void;
  dispatch: Dispatch<ParameterReducer>;
}

const ConfigSection = ({
  accessKeyID,
  secretAccessKey,
  model,
  modelValid,
  dispatch,
  isAccessKeyValid,
  region,
  accessKeyIdInput,
  secretAccessKeyInput,
  onAccessKeyIdChange,
  onSecretAccessKeyChange,
}: Props) => {
  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.configHeading}</Subheading>
      <Box>
        <Form>
          <Region dispatch={dispatch} region={region} />

          <AccessKey
            accessKeyID={accessKeyID}
            secretAccessKey={secretAccessKey}
            region={region}
            isInvalid={!isAccessKeyValid}
            accessKeyIdInput={accessKeyIdInput}
            secretAccessKeyInput={secretAccessKeyInput}
            onAccessKeyIdChange={onAccessKeyIdChange}
            onSecretAccessKeyChange={onSecretAccessKeyChange}
            dispatch={dispatch}
          />

          <Model model={model} modelValid={modelValid} dispatch={dispatch} />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigSection;
```

> Note: unlike the flat-params branch, we do **not** pass `credentials`/`region`/`credentialsValid` to `Model` — the 296 branch already made `Model` static (no live availability check), matching the OpenAI PR.

- [ ] **Step 2: Update ConfigPage imports and local state**

In `src/components/config/config-page/ConfigPage.tsx`:

Change the react import to include `useState`:

```ts
import { useMemo, useReducer, useState } from 'react';
```

Change the appInstallationParameters import to also pull the persisted type:

```ts
import AppInstallationParameters, {
  PersistedInstallationParameters,
} from '../appInstallationParameters';
```

- [ ] **Step 3: Add write-only input state and rewrite `parametersToSave`**

Inside the `ConfigPage` component, immediately after the two `useReducer` lines, add:

```ts
  const [accessKeyIdInput, setAccessKeyIdInput] = useState<string>('');
  const [secretAccessKeyInput, setSecretAccessKeyInput] = useState<string>('');
```

Replace the entire `const parametersToSave: AppInstallationParameters = useMemo(...)` block with:

```ts
  const parametersToSave: PersistedInstallationParameters = useMemo(() => {
    // Flat scalar shape: installation parameter definitions have no object
    // type, and declaring Secret credentials opts the whole object into strict
    // `additionalProperties: false` validation. Each field here must have a
    // matching definition on the AppDefinition.
    const params: PersistedInstallationParameters = {
      model: parameters.model.value,
      region: parameters.region.value,
      profile: parameters.profile.value,
      additional: parameters.brandProfile.additional?.value,
      audience: parameters.brandProfile.audience?.value,
      exclude: parameters.brandProfile.exclude?.value,
      include: parameters.brandProfile.include?.value,
      tone: parameters.brandProfile.tone?.value,
      values: parameters.brandProfile.values?.value,
      // JSON-encode the array since Symbol params are scalar-only.
      enabledFeatures: JSON.stringify(
        parameters.enabledFeatures?.value || (Object.keys(featureConfig) as AIFeature[])
      ),
    };

    // Credentials are write-only: only persist when the admin enters new values,
    // otherwise omit so we don't clobber stored Secrets with empty strings.
    if (accessKeyIdInput) params.accessKeyId = accessKeyIdInput;
    if (secretAccessKeyInput) params.secretAccessKey = secretAccessKeyInput;

    return params;
  }, [
    parameters.brandProfile,
    parameters.model.value,
    parameters.region.value,
    parameters.profile.value,
    parameters.enabledFeatures?.value,
    accessKeyIdInput,
    secretAccessKeyInput,
  ]);
```

- [ ] **Step 4: Make `validateParams` take no args**

Replace the `validateParams` declaration line:

```ts
  const validateParams = (): string[] => {
```

(The body stays the same — it already reads from `parameters` closure, not an argument.)

- [ ] **Step 5: Pass write-only props to ConfigSection**

Replace the `<ConfigSection ... />` element with:

```tsx
      <ConfigSection
        accessKeyID={parameters.accessKeyId.value}
        secretAccessKey={parameters.secretAccessKey.value}
        isAccessKeyValid={parameters.secretAccessKey.isValid}
        model={parameters.model.value}
        modelValid={parameters.model.isValid}
        region={parameters.region.value}
        accessKeyIdInput={accessKeyIdInput}
        secretAccessKeyInput={secretAccessKeyInput}
        onAccessKeyIdChange={setAccessKeyIdInput}
        onSecretAccessKeyChange={setSecretAccessKeyInput}
        dispatch={dispatchParameters}
      />
```

- [ ] **Step 6: Verify types compile**

Run: `npx tsc --noEmit`
Expected: PASS (Task 3 + this task now agree; `useSaveConfigHandler` still accepts the old signature — Task 5 tightens it, but the current `AppInstallationParameters`→`PersistedInstallationParameters` assignment may error here). If `useSaveConfigHandler`'s parameter type rejects `PersistedInstallationParameters`, proceed to Task 5 before committing.

- [ ] **Step 7: Commit (Tasks 3+4 together)**

```bash
git add src/components/config/access-key/AccessKey.tsx \
        src/components/config/config-section/ConfigSection.tsx \
        src/components/config/config-page/ConfigPage.tsx
git commit -m "feat: write-only credential inputs + flat params in config UI [AIS-296]"
```

---

## Task 5: Retype the config hooks to the persisted shape

**Files:**
- Modify: `src/hooks/config/useInitializeParameters.ts`
- Modify: `src/hooks/config/useSaveConfigHandler.ts`

**Interfaces:**
- Consumes: `PersistedInstallationParameters` (Task 1).
- Produces: `useSaveConfigHandler(parameters: PersistedInstallationParameters, validateParams: () => string[], contentTypes: Set<string>)`; `useInitializeParameters` reads `getParameters<PersistedInstallationParameters>()`.

- [ ] **Step 1: Update `useInitializeParameters` type**

In `src/hooks/config/useInitializeParameters.ts`, replace the appInstallationParameters import:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
```

and change the getParameters call:

```ts
      const parameters = await sdk.app.getParameters<PersistedInstallationParameters>();
```

- [ ] **Step 2: Update `useSaveConfigHandler` signature**

In `src/hooks/config/useSaveConfigHandler.ts`, replace the appInstallationParameters import:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
```

and change the hook signature to:

```ts
const useSaveConfigHandler = (
  parameters: PersistedInstallationParameters,
  validateParams: () => string[],
  contentTypes: Set<string>
) => {
```

and change the call inside `getCurrentState`:

```ts
    const notifierErrors = validateParams();
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/config/useInitializeParameters.ts src/hooks/config/useSaveConfigHandler.ts
git commit -m "refactor: type config hooks against persisted params [AIS-296]"
```

---

## Task 6: Update the sidebar and dialog parameter hooks

**Files:**
- Modify: `src/hooks/sidebar/useSidebarParameters.ts`
- Modify: `src/hooks/dialog/useDialogParameters.ts`

**Interfaces:**
- Consumes: `PersistedInstallationParameters` (Task 1), `AIFeature`, `featureConfig`.
- Produces: `useSidebarParameters` returns `{ hasBrandProfile, enabledFeatures }` where `enabledFeatures` is JSON-decoded from the persisted Symbol string; `useDialogParameters` is typed against the persisted shape.

- [ ] **Step 1: Rewrite `useSidebarParameters`**

Overwrite `src/hooks/sidebar/useSidebarParameters.ts` with:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';

/**
 * This hook is used to get the installation parameters from the sidebar location,
 * checks to see if there is a brand profile and returns the enabled features.
 *
 * @returns {hasBrandProfile, enabledFeatures}
 */
const useSidebarParameters = () => {
  const [hasBrandProfile, setHasBrandProfile] = useState(true);

  const sdk = useSDK<SidebarAppSDK<PersistedInstallationParameters>>();
  const installation = sdk.parameters.installation;
  const profile = installation.profile;
  // enabledFeatures is JSON-encoded as a Symbol string in the persisted shape.
  let parsedFeatures: AIFeature[] | undefined;
  try {
    parsedFeatures = installation.enabledFeatures
      ? JSON.parse(installation.enabledFeatures)
      : undefined;
  } catch {
    parsedFeatures = undefined;
  }

  useEffect(() => {
    setHasBrandProfile(!!profile);
  }, [profile]);

  // Default to all features if enabledFeatures is not set (for backward compatibility)
  const features =
    parsedFeatures && parsedFeatures.length > 0
      ? parsedFeatures
      : (Object.keys(featureConfig) as AIFeature[]);

  return {
    hasBrandProfile,
    enabledFeatures: features,
  };
};

export default useSidebarParameters;
```

- [ ] **Step 2: Retype `useDialogParameters`**

In `src/hooks/dialog/useDialogParameters.ts`, replace the appInstallationParameters import:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
```

and change the `useSDK` generic:

```ts
  const sdk = useSDK<DialogAppSDK<PersistedInstallationParameters, DialogInvocationParameters>>();
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/sidebar/useSidebarParameters.ts src/hooks/dialog/useDialogParameters.ts
git commit -m "refactor: read flat persisted params in sidebar + dialog hooks [AIS-296]"
```

---

## Task 7: Delete the browser-side Bedrock client (the SAST finding)

**Files:**
- Delete: `src/utils/aiApi/index.ts`
- Delete: `src/utils/aiApi/index.spec.ts`
- Delete: `src/utils/aiApi/handleAiApiErrors.ts`
- Delete: `test/mocks/AiMock.ts`
- Modify: `test/mocks/index.ts`

**Interfaces:**
- Consumes: nothing after this task. Verify no production import remains.
- Produces: `@utils/aiApi` and `AiMock` no longer exist.

- [ ] **Step 1: Confirm nothing in `src/` (non-spec) imports the client**

Run:
```bash
grep -rn "utils/aiApi\|from '@utils/aiApi'\|AiMock" src test | grep -v -E "src/utils/aiApi/(index|handleAiApiErrors)\b|test/mocks/AiMock.ts"
```
Expected: only spec files that `vi.mock('@utils/aiApi', ...)` — namely `OriginalTextPanel.spec.tsx` and `GeneratedTextPanel.spec.tsx`, plus `test/mocks/index.ts`. Note these for Step 3–4.

- [ ] **Step 2: Delete the client + mock files**

```bash
git rm src/utils/aiApi/index.ts \
       src/utils/aiApi/index.spec.ts \
       src/utils/aiApi/handleAiApiErrors.ts \
       test/mocks/AiMock.ts
```

- [ ] **Step 3: Drop the `AIMock` re-export**

In `test/mocks/index.ts`, delete the line:

```ts
export * as AIMock from './AiMock';
```

- [ ] **Step 4: Remove the orphaned `vi.mock('@utils/aiApi', ...)` calls**

In both `src/components/app/dialog/common-generator/output/output-text-panels/original-text-panel/OriginalTextPanel.spec.tsx` and `.../generated-text-panel/GeneratedTextPanel.spec.tsx`:
- Remove the `import { AIMock, ... } from '@test/mocks';` reference to `AIMock` (keep any other named imports on that line).
- Remove the `vi.mock('@utils/aiApi', () => AIMock);` line.

- [ ] **Step 5: Verify types + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc PASS; tests green (the two specs no longer reference the deleted mock).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: remove browser-side Bedrock IAM credential usage [AIS-296]"
```

---

## Task 8: Update test mocks to the flat persisted shape

**Files:**
- Modify: `test/mocks/sdk/parameters/happyPathParameter.ts`
- Modify: `test/mocks/sdk/parameters/initParameters.ts`
- Modify: `test/mocks/sdk/utils/generateRandomParameters.ts`
- Modify: `test/mocks/sdk/utils/createSdk.ts`
- Modify: `test/mocks/sdk/mockSdk.ts`

**Interfaces:**
- Consumes: `PersistedInstallationParameters` (Task 1).
- Produces: all SDK mocks use the flat shape (no nested `brandProfile`, no `key`; credentials as top-level scalars).

- [ ] **Step 1: happyPathParameter.ts**

Overwrite with:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';

const happyPath: PersistedInstallationParameters = {
  model: 'meta.llama2-70b-v1',
  profile: 'test-profile',
  region: '',
};

export { happyPath };
```

- [ ] **Step 2: initParameters.ts**

Overwrite with:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
import { AIFeature } from '@configs/features/featureConfig';
import { DialogInvocationParameters } from '@locations/Dialog';

const init: {
  installation: PersistedInstallationParameters;
  invocation?: DialogInvocationParameters;
} = {
  installation: {
    model: '',
    profile: '',
    region: '',
  },
  invocation: {
    feature: AIFeature.TITLE,
    entryId: '',
    fieldLocales: {},
  },
};

export { init };
```

- [ ] **Step 3: generateRandomParameters.ts**

Overwrite with:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';

const generateRandomParameters = (): PersistedInstallationParameters => {
  const randomProfile = Math.random().toString(36).substring(7);

  return {
    model: 'meta.llama2-70b-v1',
    profile: randomProfile,
    accessKeyId: 'AKIAAAAAAAAAAAAAAAAA',
    secretAccessKey: '1234',
    region: 'us-east-1',
  };
};

export { generateRandomParameters };
```

- [ ] **Step 4: createSdk.ts — retype `SdkParameters` and add `ids.app`**

In `test/mocks/sdk/utils/createSdk.ts`:
- Replace the appInstallationParameters import with:
  ```ts
  import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
  ```
- Change the `SdkParameters.installation` type to `PersistedInstallationParameters`.
- Ensure the returned mock object has an `ids: { app: 'test-app' }` field (the App-Action `useAI` reads `sdk.ids.app!`). If it is already present, leave it.

- [ ] **Step 5: mockSdk.ts — retype the stored parameters**

In `test/mocks/sdk/mockSdk.ts`, replace the appInstallationParameters import with:

```ts
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
```

and change both `installation:` type annotations (in the `originalData` field type and the constructor param type) from `AppInstallationParameters` to `PersistedInstallationParameters`.

- [ ] **Step 6: Verify types + full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc PASS; all tests green.

- [ ] **Step 7: Commit**

```bash
git add test/mocks/sdk/
git commit -m "test: update SDK mocks to flat persisted params [AIS-296]"
```

---

## Task 9: Wire the function build + App-Action deploy pipeline

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `functions/bedrock-proxy.ts` + `contentful-app-manifest.json` (already on branch), `@contentful/app-scripts` ^2.3.0 (already on branch), `@contentful/node-apps-toolkit` (already on branch).
- Produces: `npm run build` emits and bundles the function; `npm run deploy` uploads then registers the App Action via `upsert-actions`.

- [ ] **Step 1: Confirm current function-related deps/scripts on the branch**

Run:
```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify({build:p.scripts.build, buildFns:p.scripts['build:functions'], deploy:p.scripts.deploy, appScripts:p.devDependencies?.['@contentful/app-scripts']||p.dependencies?.['@contentful/app-scripts'], nodeToolkit:p.dependencies?.['@contentful/node-apps-toolkit']||p.devDependencies?.['@contentful/node-apps-toolkit'], tsconfigRec:p.devDependencies?.['@tsconfig/recommended']}, null, 2))"
```
Expected: `appScripts` is `^2.3.0`, `nodeToolkit` present, `tsconfigRec` present. Note the exact `build`/`build:functions`/`deploy` strings.

- [ ] **Step 2: Update the `build` script to bundle the function into `dist`**

Set `scripts.build` to (match the OpenAI PR's approach):

```json
"build": "tsc && vite build --mode ${NODE_ENV:='production'} && npm run build:functions && cp -r build/functions dist/functions",
```

- [ ] **Step 3: Normalize `build:functions` to the app-scripts default**

Set `scripts["build:functions"]` to:

```json
"build:functions": "contentful-app-scripts build-functions --ci",
```

- [ ] **Step 4: Add `upsert-actions` and chain it into deploy**

Add an `upsert-actions` script and append it to both deploy scripts. Keep the branch's existing definition IDs. Result:

```json
"deploy": "contentful-app-scripts upload --ci --bundle-dir ./dist --organization-id ${DEFINITIONS_ORG_ID} --definition-id jTed08LvhkveeUoBpJOim --token ${CONTENTFUL_CMA_TOKEN} && npm run upsert-actions",
"deploy:test": "contentful-app-scripts upload --ci --bundle-dir ./dist --organization-id ${DEV_TESTING_ORG_ID} --definition-id 63AGu5jLZaruxYGLmPrWSm --token ${TEST_CMA_TOKEN} && npm run upsert-actions:test",
"upsert-actions": "contentful-app-scripts upsert-actions --organization-id ${DEFINITIONS_ORG_ID} --definition-id jTed08LvhkveeUoBpJOim --token ${CONTENTFUL_CMA_TOKEN}",
"upsert-actions:test": "contentful-app-scripts upsert-actions --organization-id ${DEV_TESTING_ORG_ID} --definition-id 63AGu5jLZaruxYGLmPrWSm --token ${TEST_CMA_TOKEN}"
```

> If the branch removed the `:test` deploy variant, add only the non-`:test` `deploy` + `upsert-actions` pair and skip the `:test` lines.

- [ ] **Step 5: Verify the function bundle builds**

Run: `npm run build:functions`
Expected: emits `build/functions/bedrock-proxy.js` with no errors.

- [ ] **Step 6: Verify the manifest is discovered (schema sanity)**

Run: `node -e "const m=require('./contentful-app-manifest.json'); if(!m.functions?.length||!m.actions?.length) throw new Error('manifest missing functions/actions'); console.log('manifest OK:', m.functions[0].id, m.actions[0].id)"`
Expected: `manifest OK: bedrockProxyFunction bedrockProxyAction`.

- [ ] **Step 7: Commit**

```bash
git add package.json
git commit -m "chore: build + register bedrock proxy function on deploy [AIS-296]"
```

---

## Task 10: (Optional UX polish) Skeleton loader while generating

> The 296 branch shows an empty textarea while generating. The OpenAI PR / flat-params branch show a Forma 36 skeleton loader instead. This is a UX nicety, not part of the security fix. Include it only if you want full parity with the reference PR; otherwise skip to Task 11.

**Files:**
- Create: `src/components/app/dialog/common-generator/output/output-text-panels/generated-text-panel/GeneratedTextSkeleton.tsx`
- Create: `src/components/app/dialog/common-generator/output/output-text-panels/generated-text-panel/GeneratedTextSkeleton.styles.ts`
- Modify: `src/components/app/dialog/common-generator/output/output-text-panels/generated-text-panel/GeneratedTextPanel.tsx`
- Modify: `src/components/app/dialog/common-generator/output/output-text-panels/generated-text-panel/GeneratedTextPanel.styles.ts`

**Interfaces:**
- Consumes: `useAI` return (`isGenerating`, `stopMessageGeneration`, `output`, etc. — already present on branch).
- Produces: `GeneratedTextSkeleton` component with `testId="generated-text-skeleton"`.

- [ ] **Step 1: Write the failing test**

Add to `GeneratedTextPanel.spec.tsx` (inside the existing `describe`):

```tsx
  it('renders the loading skeleton while generating', () => {
    const hook = renderHook(() => useAI());
    hook.result.current.isGenerating = true;

    const { container, getByText, unmount } = render(
      <Tabs currentTab={OutputTab.GENERATED_TEXT}>
        <GeneratedTextPanel
          generate={() => {}}
          ai={hook.result.current}
          outputFieldValidation={null}
          apply={() => {}}
        />
      </Tabs>
    );

    expect(container.querySelector('[data-test-id="generated-text-skeleton"]')).toBeTruthy();
    expect(getByText('Stop Generating')).toBeTruthy();
    unmount();
  });
```

Ensure the spec imports `renderHook`, `useAI`, `Tabs`, `OutputTab`, `GeneratedTextPanel` (add any missing imports).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/app/dialog/common-generator/output/output-text-panels/generated-text-panel/GeneratedTextPanel.spec.tsx`
Expected: FAIL — no element with `data-test-id="generated-text-skeleton"`.

- [ ] **Step 3: Create the skeleton styles**

Create `GeneratedTextSkeleton.styles.ts`:

```ts
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  skeleton: css({
    width: '100%',
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
};
```

- [ ] **Step 4: Create the skeleton component**

Create `GeneratedTextSkeleton.tsx`:

```tsx
import { SkeletonContainer, SkeletonBodyText } from '@contentful/f36-components';
import { styles } from './GeneratedTextSkeleton.styles';

/**
 * Placeholder shown while Bedrock generates content. Renders grey pulsing lines
 * (Forma 36's skeleton loader) that stand in for the text about to appear.
 */
const GeneratedTextSkeleton = () => {
  return (
    <SkeletonContainer
      testId="generated-text-skeleton"
      ariaLabel="Generating content…"
      svgHeight={110}
      css={styles.skeleton}>
      <SkeletonBodyText numberOfLines={5} marginBottom={12} offsetTop={4} />
    </SkeletonContainer>
  );
};

export default GeneratedTextSkeleton;
```

- [ ] **Step 5: Add the `generatingContainer` style**

In `GeneratedTextPanel.styles.ts`, add a `generatingContainer` entry (keep existing entries):

```ts
  generatingContainer: css({
    height: '100%',
    paddingLeft: tokens.spacing2Xl,
    paddingRight: tokens.spacing2Xl,
  }),
```

Ensure `tokens` is imported (`import tokens from '@contentful/f36-tokens';`).

- [ ] **Step 6: Swap the generating branch to render the skeleton**

In `GeneratedTextPanel.tsx`, add imports:

```tsx
import { Flex } from '@contentful/f36-components'; // add Flex to the existing f36-components import
import GeneratedTextSkeleton from './GeneratedTextSkeleton';
```

Replace the `isGenerating ? (...) :` branch with:

```tsx
      {isGenerating ? (
        <Flex flexDirection="column" fullWidth css={styles.generatingContainer}>
          <GeneratedTextSkeleton />
          <Flex alignSelf="flex-end">
            <Button onClick={() => stopMessageGeneration()}>Stop Generating</Button>
          </Flex>
        </Flex>
      ) : (
```

- [ ] **Step 7: Run tests + types**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc PASS; all tests green including the new skeleton test.

- [ ] **Step 8: Commit**

```bash
git add src/components/app/dialog/common-generator/output/output-text-panels/generated-text-panel/
git commit -m "feat: show skeleton loader while bedrock proxy generates [AIS-296]"
```

---

## Task 11: Full verification + PR

**Files:** none (verification only).

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors, 0 warnings. (If prettier violations appear on changed files, run the repo's formatter and re-commit as `style: fix prettier violations [AIS-296]`.)

- [ ] **Step 3: Full test suite (non-watch)**

Run: `npx vitest run`
Expected: all tests green. Record the pass count for the PR body.

- [ ] **Step 4: Function bundle**

Run: `npm run build:functions`
Expected: emits `build/functions/bedrock-proxy.js`.

- [ ] **Step 5: Grep for any residual browser-side credential usage**

Run:
```bash
grep -rn "new BedrockClient\|new BedrockRuntimeClient\|utils/aiApi\|accessKeyId.*secretAccessKey" src | grep -v spec
```
Expected: no matches in production code (credentials only flow through `sdk.cma.appActionCall` → the function).

- [ ] **Step 6: Open the PR with the create-pr skill**

Use the `create-pr` skill. Title: `fix: move AWS Bedrock IAM credentials to secret installation parameters [AIS-296]`. In the body, include:
  - Summary mirroring PR #11202's structure (proxy function + App Action; flattened params; write-only config; static model list; deleted browser-side client).
  - **Manual pre-deploy step:** the AppDefinition must declare `accessKeyId` and `secretAccessKey` as `"type": "Secret"` (and the remaining installation fields as `Symbol`) via CMA or the Contentful UI before deploy — without it, the keys remain plaintext in the browser even after this code lands.
  - **Completion instruction from the ticket:** update the status column for row 273 in the Cypress SAST findings spreadsheet and keep the Jira ticket in sync.
  - Test plan checklist: `tsc` clean, `vitest run` green (N/N), `lint` clean, `build:functions` emits the bundle, and manual end-to-end App Action invocation in a test space after the Secret declaration.

---

## Self-Review Notes

- **Spec coverage:** ticket's core finding (browser-side `BedrockClient`/`BedrockRuntimeClient` with plaintext IAM keys) → Task 7 deletes it; server-side proxy already on branch. Secret storage → Tasks 1–6 flatten params so a `Secret` declaration validates; write-only inputs (Tasks 3–4) prevent reading keys back. Deploy of the function/action → Task 9. Completion/spreadsheet sync → Task 11 Step 6.
- **Type consistency:** `PersistedInstallationParameters` (defined Task 1) is used verbatim in Tasks 2, 4, 5, 6, 8. `validateParams` becomes zero-arg in both ConfigPage (Task 4) and useSaveConfigHandler (Task 5). `enabledFeatures` is `string` (JSON) in the persisted type and decoded in the reducer (Task 2) and sidebar hook (Task 6), encoded in ConfigPage (Task 4).
- **Do-not-do:** flat-params' `useAI.tsx` and its `ConfigSection`→`Model` credential props are deliberately excluded (they retain browser-side Bedrock calls / live availability checks that the 296 branch already removed).
- **Ordering caveat:** Task 3 intentionally leaves the tree non-compiling until Task 4; they commit together (Task 4 Step 7). All other tasks compile independently.
