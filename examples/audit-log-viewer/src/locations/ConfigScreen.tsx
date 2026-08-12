import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  Box,
  Flex,
  FormControl,
  Heading,
  Note,
  Select,
  Text,
  Textarea,
  TextInput,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  buildParametersOnSave,
  EGRESS_IPS,
  emptyConfigForm,
  missingRequiredParameters,
  SECRET_FIELDS,
  type ConfigFormState,
  type Provider,
} from '../lib/configParams';

const iamPolicy = (bucket: string) =>
  JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 's3:ListBucket',
          Resource: `arn:aws:s3:::${bucket || '<bucket>'}`,
        },
        {
          Effect: 'Allow',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucket || '<bucket>'}/*contentful-audit-*`,
        },
      ],
    },
    null,
    2
  );

const corsRule = JSON.stringify(
  [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      // Hosted app bundles are served from a sandboxed *.ctfcloud.net origin,
      // not app.contentful.com — both are needed.
      AllowedOrigins: ['https://app.contentful.com', 'https://*.ctfcloud.net'],
      ExposeHeaders: [],
      MaxAgeSeconds: 3000,
    },
  ],
  null,
  2
);

const Code = ({ children }: { children: string }) => (
  <pre
    style={{
      background: tokens.colorElementLightest,
      border: `1px solid ${tokens.colorElementLight}`,
      borderRadius: tokens.borderRadiusMedium,
      padding: tokens.spacingS,
      fontSize: tokens.fontSizeS,
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
    }}>
    {children}
  </pre>
);

const SECRET_KEYS = new Set<string>(Object.values(SECRET_FIELDS).flat());

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [form, setForm] = useState<ConfigFormState>(emptyConfigForm());
  const [saved, setSaved] = useState<Record<string, unknown>>({});
  const [restoredFromBackup, setRestoredFromBackup] = useState(false);

  const backupKey = `audit-log-config-${sdk.ids.space}-${sdk.ids.app}`;

  const writeBackup = useCallback(
    (params: Record<string, string>) => {
      const safe: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (!SECRET_KEYS.has(k)) safe[k] = v;
      }
      localStorage.setItem(backupKey, JSON.stringify(safe));
    },
    [backupKey]
  );

  const onConfigure = useCallback(async () => {
    const missing = missingRequiredParameters(form, saved);
    if (missing.length > 0) {
      sdk.notifier.error(`Missing required configuration: ${missing.join(', ')}`);
      return false;
    }
    const currentState = await sdk.app.getCurrentState();
    const parameters = buildParametersOnSave(form, saved);
    writeBackup(parameters);
    return { parameters, targetState: currentState };
  }, [form, saved, sdk, writeBackup]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const current = (await sdk.app.getParameters()) as Record<string, string> | null;
      if (current && Object.keys(current).length > 0) {
        setSaved(current);
        const next = emptyConfigForm();
        next.provider = (['s3', 'azure', 'gcs'] as const).includes(current.provider as Provider)
          ? (current.provider as Provider)
          : 's3';
        for (const key of Object.keys(next) as Array<keyof ConfigFormState>) {
          if (key === 'provider' || SECRET_KEYS.has(key)) continue;
          const value = current[key];
          if (typeof value === 'string') {
            (next as unknown as Record<string, string>)[key] = value;
          }
        }
        // secrets stay blank — placeholder tells the installer a value is stored
        setForm(next);
        writeBackup(current);
      } else {
        // Params are empty — check for a local backup (e.g. after a bundle update wiped them)
        const raw = localStorage.getItem(backupKey);
        if (raw) {
          try {
            const backup = JSON.parse(raw) as Record<string, string>;
            const next = emptyConfigForm();
            next.provider = (['s3', 'azure', 'gcs'] as const).includes(backup.provider as Provider)
              ? (backup.provider as Provider)
              : 's3';
            for (const key of Object.keys(next) as Array<keyof ConfigFormState>) {
              if (key === 'provider' || SECRET_KEYS.has(key)) continue;
              if (typeof backup[key] === 'string') {
                (next as unknown as Record<string, string>)[key] = backup[key];
              }
            }
            setForm(next);
            setRestoredFromBackup(true);
          } catch {
            // Corrupted backup — ignore
          }
        }
      }
      sdk.app.setReady();
    })();
  }, [sdk, backupKey, writeBackup]);

  const set = (key: keyof ConfigFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const hasSavedSecret = (key: string) => typeof saved[key] === 'string' && saved[key] !== '';

  return (
    <Flex justifyContent="center">
      <Box padding="spacingXl" style={{ maxWidth: tokens.contentWidthText, width: '100%' }}>
        <Heading as="h1">Audit Log Viewer configuration</Heading>
        {restoredFromBackup && (
          <Note
            variant="warning"
            title="Configuration restored from local backup"
            marginBottom="spacingL">
            Your saved configuration was cleared — likely by a recent app update. Non-secret fields
            have been restored from your browser&apos;s local backup. Re-enter your credentials and
            save to confirm.
          </Note>
        )}
        <Note variant="primary" title="Security model" marginBottom="spacingL">
          <Text as="p">
            Storage credentials are stored as secure installation parameters and are only readable
            by the app&apos;s server-side Function. The browser only ever receives short-lived,
            read-only pre-signed URLs.
          </Text>
          <Text as="p" marginTop="spacingS">
            Anyone with access to this space can view the entire organization&apos;s audit logs
            through this app. Install it only into a space restricted to administrators.
          </Text>
        </Note>

        <FormControl isRequired>
          <FormControl.Label>Storage provider</FormControl.Label>
          <Select
            value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as Provider }))}>
            <Select.Option value="s3">Amazon S3</Select.Option>
            <Select.Option value="azure">Azure Blob Storage</Select.Option>
            <Select.Option value="gcs">Google Cloud Storage</Select.Option>
          </Select>
          <FormControl.HelpText>
            Switching provider replaces the saved configuration — the previous provider&apos;s
            credentials are removed on save and must be re-entered if you switch back.
          </FormControl.HelpText>
        </FormControl>

        {form.provider === 's3' && (
          <>
            <FormControl isRequired>
              <FormControl.Label>S3 bucket name</FormControl.Label>
              <TextInput value={form.bucketName} onChange={set('bucketName')} />
            </FormControl>
            <FormControl isRequired>
              <FormControl.Label>AWS region</FormControl.Label>
              <TextInput value={form.region} onChange={set('region')} placeholder="eu-west-1" />
            </FormControl>
          </>
        )}
        <FormControl isOptional>
          <FormControl.Label>Key prefix</FormControl.Label>
          <TextInput value={form.prefix} onChange={set('prefix')} placeholder="audit/" />
          <FormControl.HelpText>
            Only needed if your audit files live under a folder. Must end with /
          </FormControl.HelpText>
        </FormControl>
        {form.provider === 's3' && (
          <>
            <FormControl isRequired>
              <FormControl.Label>AWS access key ID</FormControl.Label>
              <TextInput
                value={form.awsAccessKeyId}
                onChange={set('awsAccessKeyId')}
                type="password"
                placeholder={hasSavedSecret('awsAccessKeyId') ? '••••••••  (saved)' : ''}
              />
            </FormControl>
            <FormControl isRequired>
              <FormControl.Label>AWS secret access key</FormControl.Label>
              <TextInput
                value={form.awsSecretAccessKey}
                onChange={set('awsSecretAccessKey')}
                type="password"
                placeholder={hasSavedSecret('awsSecretAccessKey') ? '••••••••  (saved)' : ''}
              />
              <FormControl.HelpText>
                Stored as a secure parameter — never sent to the browser after saving.
              </FormControl.HelpText>
            </FormControl>
          </>
        )}
        {form.provider === 'azure' && (
          <>
            <FormControl isRequired>
              <FormControl.Label>Storage account name</FormControl.Label>
              <TextInput value={form.azureAccountName} onChange={set('azureAccountName')} />
            </FormControl>
            <FormControl isRequired>
              <FormControl.Label>Container name</FormControl.Label>
              <TextInput value={form.azureContainerName} onChange={set('azureContainerName')} />
            </FormControl>
            <FormControl isRequired>
              <FormControl.Label>Storage account key</FormControl.Label>
              <TextInput
                value={form.azureAccountKey}
                onChange={set('azureAccountKey')}
                type="password"
                placeholder={hasSavedSecret('azureAccountKey') ? '••••••••  (saved)' : ''}
              />
              <FormControl.HelpText>
                Azure portal → storage account → Access keys. Stored as a secure parameter.
              </FormControl.HelpText>
            </FormControl>
          </>
        )}
        {form.provider === 'gcs' && (
          <>
            <FormControl isRequired>
              <FormControl.Label>Bucket name</FormControl.Label>
              <TextInput value={form.gcsBucketName} onChange={set('gcsBucketName')} />
            </FormControl>
            <FormControl isRequired>
              <FormControl.Label>Service account key (JSON)</FormControl.Label>
              <Textarea
                value={form.gcsServiceAccountKey}
                onChange={(e) => setForm((f) => ({ ...f, gcsServiceAccountKey: e.target.value }))}
                rows={6}
                placeholder={
                  hasSavedSecret('gcsServiceAccountKey')
                    ? '(saved — paste a new key to replace)'
                    : '{ "type": "service_account", ... }'
                }
              />
              <FormControl.HelpText>
                Paste the full JSON key file of a service account with the Storage Object Viewer
                role. Stored as a secure parameter.
              </FormControl.HelpText>
            </FormControl>
          </>
        )}

        {form.provider === 's3' && (
          <>
            <FormControl isOptional>
              <FormControl.Label>IAM role ARN to assume</FormControl.Label>
              <TextInput
                value={form.roleArn}
                onChange={set('roleArn')}
                placeholder="arn:aws:iam::123456789012:role/contentful-audit-log-reader"
              />
              <FormControl.HelpText>
                Recommended. Using a role instead of long-lived access keys limits the blast radius
                if credentials are rotated or leaked.
              </FormControl.HelpText>
            </FormControl>
            <FormControl isOptional>
              <FormControl.Label>STS external ID</FormControl.Label>
              <TextInput value={form.externalId} onChange={set('externalId')} />
            </FormControl>
          </>
        )}

        <Accordion>
          {form.provider === 's3' && (
            <>
              <Accordion.Item title="AWS setup — read-only IAM policy">
                <Text>
                  Attach this policy to the IAM role (or directly to the IAM user if not using a
                  role):
                </Text>
                <Code>{iamPolicy(form.bucketName)}</Code>
              </Accordion.Item>
              <Accordion.Item title="Bucket CORS (required)">
                <Text>
                  The browser downloads log files via pre-signed URLs, so the bucket must allow GET
                  from the Contentful web app origin. For local development, temporarily add
                  http://localhost:3000 to AllowedOrigins.
                </Text>
                <Code>{corsRule}</Code>
              </Accordion.Item>
            </>
          )}
          {form.provider === 'azure' && (
            <Accordion.Item title="Azure setup — key and CORS">
              <Text>
                Access key: Azure portal → storage account → Security + networking → Access keys.
                The app mints short-lived read-only SAS URLs from it; the key itself never leaves
                Contentful&apos;s server-side Function. Blob CORS (storage account → Resource
                sharing) must allow GET/HEAD from:
              </Text>
              <Code>{'https://app.contentful.com\nhttps://*.ctfcloud.net'}</Code>
            </Accordion.Item>
          )}
          {form.provider === 'gcs' && (
            <Accordion.Item title="GCS setup — service account and CORS">
              <Text>
                Create a service account with the Storage Object Viewer role on the bucket, create a
                JSON key, and paste it above. Bucket CORS must allow GET/HEAD from the origins below
                (gcloud: gsutil cors set cors.json gs://&lt;bucket&gt;):
              </Text>
              <Code>
                {JSON.stringify(
                  [
                    {
                      origin: ['*'],
                      method: ['GET', 'HEAD'],
                      maxAgeSeconds: 3000,
                    },
                  ],
                  null,
                  2
                )}
              </Code>
              <Text marginTop="spacingS">
                GCS CORS does not support wildcard subdomains, and the Contentful app iframe runs on
                a per-app ctfcloud.net origin, so &quot;*&quot; is required. This is safe: the URLs
                themselves are auth&apos;d by their V4 signature and expire after 15 minutes — CORS
                adds no access control here.
              </Text>
            </Accordion.Item>
          )}
          <Accordion.Item title="Function egress IPs (optional allowlisting)">
            <Text>
              The server-side Function always calls your storage provider from these static IPs. You
              can restrict the IAM user/role with an aws:SourceIp condition on ListBucket. Do NOT
              apply an IP condition to s3:GetObject — pre-signed downloads come from your
              editors&apos; browsers, not from these IPs.
            </Text>
            <Code>{EGRESS_IPS.join('\n')}</Code>
          </Accordion.Item>
        </Accordion>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
