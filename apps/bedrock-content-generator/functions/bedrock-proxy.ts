import type {
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';

export type BedrockProxyParameters = {
  systemPrompt: string;
  prompt: string;
  model: string;
};

type BedrockProxyResponse = {
  text: string;
};

type InstallationParameters = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  model: string;
  profile: string;
  brandProfile: Record<string, string | undefined>;
};

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  BedrockProxyParameters
> = async (
  event: AppActionRequest<'Custom', BedrockProxyParameters>,
  context: FunctionEventContext
): Promise<BedrockProxyResponse> => {
  const { accessKeyId, secretAccessKey, region } =
    context.appInstallationParameters as InstallationParameters;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials are not configured');
  }

  if (!region) {
    throw new Error('AWS region is not configured');
  }

  const { systemPrompt, prompt, model } = event.body;

  const requestBody = buildRequestBody(model, systemPrompt, prompt);

  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const path = `/model/${encodeURIComponent(model)}/invoke`;
  const url = `https://${host}${path}`;
  const amzDate = new Date().toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);

  const contentHash = await sha256Hex(requestBody);

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${contentHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'POST',
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    contentHash,
  ].join('\n');

  const credentialScope = buildCredentialScope(dateStamp, region);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, 'bedrock');
  const signature = await hmacHex(signingKey, stringToSign);

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'X-Amz-Content-SHA256': contentHash,
      Authorization: authorizationHeader,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Bedrock request failed: ${response.status} ${(errorBody as { message?: string }).message ?? response.statusText}`
    );
  }

  const data = await response.json();
  const text = parseResponseText(model, data);

  return { text };
};

/** Exported for unit testing — asserts the correct SigV4 signing name `bedrock`. */
export function buildCredentialScope(dateStamp: string, region: string): string {
  return `${dateStamp}/${region}/bedrock/aws4_request`;
}

function buildRequestBody(model: string, systemPrompt: string, prompt: string): string {
  if (model.startsWith('mistral.')) {
    return JSON.stringify({
      prompt: `<s>[INST] ${systemPrompt} [/INST]\n[INST] ${prompt} [/INST]`,
      max_tokens: 2048,
    });
  }

  if (model.startsWith('meta.')) {
    return JSON.stringify({
      prompt: `${systemPrompt}\n\nHuman: ${prompt}\n\nAssistant:`,
      max_gen_len: 2048,
    });
  }

  // Claude (anthropic. model IDs and inference profile IDs: us.*, eu.*, global.*)
  return JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      },
    ],
  });
}

function parseResponseText(model: string, data: unknown): string {
  if (model.startsWith('mistral.')) {
    const d = data as { outputs?: Array<{ text: string }> };
    return d.outputs?.[0]?.text ?? '';
  }

  if (model.startsWith('meta.')) {
    const d = data as { generation?: string };
    return d.generation ?? '';
  }

  // Claude
  const d = data as { content?: Array<{ type: string; text: string }> };
  return d.content?.find((b) => b.type === 'text')?.text ?? '';
}

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuffer);
}

async function hmacHex(key: ArrayBuffer, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return bufToHex(signature);
}

async function hmacBuf(key: ArrayBuffer | string, message: string): Promise<ArrayBuffer> {
  const rawKey = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

export async function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacBuf(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacBuf(kDate, region);
  const kService = await hmacBuf(kRegion, service);
  return hmacBuf(kService, 'aws4_request');
}

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
