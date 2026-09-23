# Audit Log Viewer — Contentful App

View and filter your organisation's Contentful audit logs — delivered to your
own **AWS S3 bucket, Azure Blob container, or Google Cloud Storage bucket** —
from a page inside the Contentful web app.

**Security model:** the browser never sees cloud credentials. A
Contentful-hosted App Action Function holds them (secure installation
parameters), lists matching log files, and returns short-lived (15 min)
time-limited GET URLs (S3 presigned / Azure SAS / GCS V4-signed). The browser
fetches and parses the log files itself and renders the table and charts.

```
┌─────────────────────┐   app action call    ┌──────────────────────────┐
│ Page location (React│ ───────────────────► │ Function "auditLogBroker"│
│ + Forma 36, iframe) │ ◄─────────────────── │ (Contentful-hosted)      │
│ no secrets          │   signed URLs        │ Secret params → sign     │
└─────────┬───────────┘                      └────────────┬─────────────┘
          │  GET (signed URL, CORS)                       │ list objects
          ▼                                               ▼
   ┌──────────── your S3 bucket / Azure container / GCS bucket ─────┐
   │ contentful-audit-<orgId>-<YYYYMMDDTHHMMSSsssZ>.json (daily)    │
   └────────────────────────────────────────────────────────────────┘
```

### Access model — read before installing

Installing this app in a space exposes the **entire organization's** audit
logs (all spaces, all users' actions) to **every user** who can access that
space's Apps/page locations. The Function performs no per-user authorization
of its own — any member of a space where the app is installed can invoke the
action and read the whole org's audit logs. **Install it only into a
restricted, admin-only space.**

## Storage providers

| provider | list mechanism | browser URLs | credentials (Secret params) | status |
|---|---|---|---|---|
| `s3` (default) | ListObjectsV2 (AWS SDK v3) | presigned GET, 15 min | `awsAccessKeyId` + `awsSecretAccessKey` (optional STS role) | **verified live** |
| `azure` | List Blobs REST + container SAS | per-blob SAS, 15 min | `azureAccountKey` | **verified live** (2026-07-06: listing + SAS download against a real storage account) |
| `gcs` | JSON API + OAuth JWT grant | V4 signed URLs, 15 min | `gcsServiceAccountKey` (JSON) | **verified live** (2026-07-06: listing, signed-URL download and in-app browser view against a real bucket) |

Two live-verification findings baked into the code: the Functions runtime
rejects calls to a detached `fetch` reference ("Illegal invocation") — both
providers wrap it — and Azure prefixes its XML responses with a UTF-8 BOM,
which is stripped before parsing.

All three providers are built on plain `fetch` + WebCrypto (no provider
SDKs; S3 uses the AWS SDK) and have been verified against live storage:
listing, time-limited URL minting, and download.

## Quick start — from zero to reading data

1. **Contentful side:** an org admin configures audit-log delivery
   (Organization settings → Audit logs) to your S3 bucket / Azure container /
   GCS bucket — see Contentful's setup guide in Prerequisites. Files arrive
   daily; each covers the previous day. (For a dry run you can skip this and
   upload any correctly-named `contentful-audit-*.json` file yourself.)
2. **Cloud side:** follow the provider section below — create a read-only
   machine credential and set the storage CORS rule.
3. **Deploy the app** (once per org): "Create the app definition & deploy".
4. **Install + configure:** install the app into an admin-only space, pick
   your provider on the configuration screen, enter the credential, save.
5. **Read the data:** open the space's Apps menu → Audit Log Viewer, set a
   date range covering delivered files, click **Load logs**. Filter by
   space/actor/action or search; charts and table follow the filters.

## AWS SDK compatibility in the Contentful Functions runtime

The Step-1 gate test passed on 2026-07-02 (full record: `docs/superpowers/plans/gate-result.md` in the repo root). `@aws-sdk/client-s3`, `@aws-sdk/client-sts` and `@aws-sdk/s3-request-presigner` (v3.1078) all run inside the Contentful Functions runtime, with two required adjustments:

1. Every AWS client must be constructed with `requestHandler: new FetchHttpHandler()` (`@smithy/fetch-http-handler`) — the runtime has no `node:http`/`node:https`.
2. The runtime lacks the DOM globals the SDK's browser build uses to deserialize S3's XML responses. `DOMParser` and `Node` are polyfilled from `@xmldom/xmldom` at module load (see `functions/lib/storage/s3.ts`); without this the SDK fails with `ReferenceError: DOMParser is not defined`.

The manifest's `allowNetworks: ["*.amazonaws.com"]` wildcard was accepted at build, upload and runtime. One platform quirk to know: **activating a new bundle wipes the app installation's parameters** — after every app update, re-save the configuration screen (or in development run `npm run install-app`, which re-installs the app with parameters from `.env`).

## Prerequisites

- Contentful org on a plan with **Functions** (Premium) and **Audit Logs**
  enabled, with audit-log delivery configured to one of the three supported
  destinations
  (https://www.contentful.com/developers/docs/tutorials/general/audit-logs/).
- Node 20+, a CMA token with org admin rights (deploy time only).
- Rights in your cloud account to create one read-only machine credential:
  AWS IAM user, Azure storage-account key access, or a GCP service account.

## AWS IAM setup (customer side)

### 1. Create the IAM user (AWS Console walkthrough)

1. **IAM → Users → Create user.** Name it e.g. `audit-logs-visualiser`.
   Leave **"Provide user access to the AWS Management Console" UNCHECKED** —
   this is a machine identity for the app, not a person (unchecking also
   skips the Identity Center prompt).
2. On **Set permissions**, choose **Attach policies directly → Create policy
   → JSON** and paste the read-only policy below (opens in a new tab; after
   creating it, refresh the policy list in the original tab, tick it, then
   **Next → Create user**):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::<bucket>" },
    { "Effect": "Allow", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::<bucket>/*" }
  ]
}
```

3. Open the created user → **Security credentials → Access keys → Create
   access key** → use case **"Application running outside AWS"** (or
   "Other"). Copy the **Access key ID** and **Secret access key** immediately
   — the secret is shown only once. These two values go into the app's
   configuration screen (stored as Secret installation parameters).

This direct-key setup is the verified, tested path. The key can list and
read one bucket and nothing else.

### 2. Optional hardening: STS role assumption

Instead of attaching the read policy to the user directly, you can make the
user's *only* permission `sts:AssumeRole` into a read-only role — the app
then assumes the role at request time (fill "role ARN" + "external ID" in
the app config):

- Role `contentful-audit-log-reader` carries the read-only policy from step 1.
- The user gets only:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "sts:AssumeRole", "Resource": "arn:aws:iam::<account>:role/contentful-audit-log-reader" }
  ]
}
```

- Role trust policy (use any random string as ExternalId and enter it in the app config):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::<account>:user/<app-user>" },
      "Action": "sts:AssumeRole",
      "Condition": { "StringEquals": { "sts:ExternalId": "<external-id>" } }
    }
  ]
}
```

### 3. Bucket CORS (required)

Required because editors' browsers download the log files.
   Contentful serves hosted app bundles from a sandboxed per-app origin on
   `ctfcloud.net` (not `app.contentful.com`), so both origins are needed:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://app.contentful.com", "https://*.ctfcloud.net"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

### 4. Optional IP allowlisting

The Function's outbound calls always come from
   Contentful's static egress IPs: `104.28.4.4/32`, `104.28.4.5/32`,
   `104.28.4.6/32`, `104.28.4.7/32`, `2a09:bac5:fff0:95::/64`,
   `2a09:bac6:fff0:95::/64`. You may add an `aws:SourceIp` condition for these
   on `s3:ListBucket` / `sts:AssumeRole`. **Do not** put an IP condition on
   `s3:GetObject`: pre-signed downloads come from your editors' browser IPs.

## Azure Blob setup (customer side)

1. **Storage account** — Create a resource → Storage account (Standard
   performance, LRS is fine). The account name must be **3–24 lowercase
   letters/digits** — the app validates this and rejects anything else.
   Wait for the deployment to complete (~1 minute), then **Go to resource**.
2. **Container** — storage account → Containers → **+ Container** (private
   access level, the default). This is the container Contentful delivers
   audit logs into.
3. **Access key** — storage account left menu → **Security + networking →
   Access keys** → **Show keys** → copy **key1**'s *Key* value (the long
   base64 string — not the connection string). This is the only credential
   the app needs; it stays server-side and browsers only ever receive
   15-minute single-blob SAS URLs. Note: Access keys and CORS are blades
   *inside the storage account resource*, not entries in the global "All
   services" catalog — open the storage account first.
4. **Blob CORS** — storage account left menu → **Settings → Resource sharing
   (CORS)** → **Blob service** tab → add a row and Save:

   | Allowed origins | Allowed methods | Allowed headers | Exposed headers | Max age |
   |---|---|---|---|---|
   | `https://app.contentful.com,https://*.ctfcloud.net` | `GET,HEAD` | `*` | `*` | `3000` |

5. **App config screen:** provider "Azure Blob Storage" → account name,
   container name, account key → Save.
6. Housekeeping: Azure lets you rotate key1/key2 independently (Access keys →
   Rotate) — if the key is ever exposed, rotate it and re-enter it in the
   app configuration.

## Google Cloud Storage setup (customer side)

1. Create a service account (IAM & Admin → Service Accounts → Create; no
   project-level roles needed).
2. Grant it access on the **bucket**: bucket → Permissions → Grant access →
   the service account's email → role **Storage Object Viewer**. Watch the
   role name: **"Storage Viewer" is a different role** that can read bucket
   metadata but NOT list objects — it fails with
   `storage.objects.list denied`. You need Storage **Object** Viewer.
3. Service account → Keys → **Add key → JSON**; paste the downloaded file's
   entire content into the app config screen ("Service account key (JSON)").
4. **Bucket CORS** — required for browser downloads, and it **cannot be set
   from the Cloud Console UI**; use Cloud Shell (the `>_` icon in the console
   toolbar) or a local `gcloud`:

```bash
echo '[{"origin": ["*"], "method": ["GET", "HEAD"], "maxAgeSeconds": 3000}]' > cors.json
gcloud storage buckets update gs://<bucket> --cors-file=cors.json
```

   (Alternatively PATCH the bucket via the JSON API with a token whose role
   temporarily includes bucket update rights, then drop the role again.)
   The applied policy, for reference:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3000
  }
]
```

GCS CORS does not support wildcard subdomains, and the Contentful app iframe runs on a per-app ctfcloud.net origin, so "*" is required. This is safe: the URLs themselves are auth'd by their V4 signature and expire after 15 minutes — CORS adds no access control here.

## Create the app definition & deploy

```bash
npm install
npm run create-app-definition   # name: Audit Log Viewer; locations: Page + App configuration screen
# put CONTENTFUL_ACCESS_TOKEN / CONTENTFUL_ORG_ID / CONTENTFUL_APP_DEF_ID
# / CONTENTFUL_SPACE_ID in .env
# for `npm run install-app` (dev), also add AWS_BUCKET_NAME / AWS_REGION /
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (+ optional AWS_ROLE_ARN,
# AWS_EXTERNAL_ID, AWS_PREFIX) — these mirror the installation parameters
# you would otherwise enter on the app configuration screen
npm run build && npm run upload # bundles frontend + function, activates
npm run configure-app           # installation parameters + app action
npm run set-app-icon            # app icon from assets/logo.png (AppDetails
                                # wants a data URI, not raw base64)
```

## Install & configure

Install the app into a space (Apps → Custom apps). On the configuration
screen, pick your **storage provider** from the dropdown — the credential
fields switch accordingly:

- **Amazon S3:** bucket name, region, access key id + secret (optional role
  ARN + external ID for STS hardening).
- **Azure Blob Storage:** storage account name, container name, account key.
- **Google Cloud Storage:** bucket name, service-account key (paste the whole
  JSON file).

All credential fields are stored as **Secret** installation parameters. An
optional key prefix applies to every provider (only if your files live under
a folder; must end with `/`). The screen also shows the provider-specific
setup steps (IAM policy / CORS / egress IPs) to copy. Two behaviors to know:

- **Switching provider replaces the saved configuration** — the previous
  provider's credentials are removed on save and must be re-entered if you
  switch back.
- **After every app update** (new bundle activation) Contentful clears the
  saved parameters — revisit this screen and save again.

Saving the configuration without retyping the secrets **preserves the stored values**: verified against the platform — re-sending the redacted placeholders on save leaves the original secrets intact and the Function continues to authenticate.

## Installation parameters

| id | type | required | purpose |
|---|---|---|---|
| `bucketName` | Symbol | yes | audit-log bucket |
| `region` | Symbol | yes | bucket region, e.g. `eu-west-1` |
| `prefix` | Symbol | no | key prefix if files live under a folder (end with `/`) |
| `roleArn` | Symbol | no | read-only role the function assumes |
| `externalId` | Symbol | no | STS external id for the trust policy |
| `awsAccessKeyId` | **Secret** | yes | never readable by the browser |
| `awsSecretAccessKey` | **Secret** | yes | never readable by the browser |
| `provider` | Symbol | no | `s3` (default), `azure`, or `gcs` |
| `azureAccountName` | Symbol | azure | storage account name |
| `azureContainerName` | Symbol | azure | container receiving the audit logs |
| `azureAccountKey` | **Secret** | azure | storage account access key |
| `gcsBucketName` | Symbol | gcs | bucket receiving the audit logs |
| `gcsServiceAccountKey` | **Secret** | gcs | full JSON key of a Storage Object Viewer service account |

## Local development

```bash
npm run dev          # frontend on http://localhost:3000 (set as app URL for dev)
npx vitest run       # unit tests (function + parser + UI)
npm run invoke -- 2026-06-01 2026-06-30   # smoke-invoke the deployed action
npm run install-app   # re-install app + parameters from .env (needed after every upload)
```

The Function cannot run locally (no emulator) — the dev loop is: edit →
`npm run build && npm run upload` → `npm run invoke`.

`npm run install-app` reads its provider from `.env`. For S3 (default) use
the `AWS_*` variables shown above. To install against Azure instead, set
`PROVIDER=azure` plus `AZURE_ACCOUNT_NAME` / `AZURE_CONTAINER_NAME` /
`AZURE_ACCOUNT_KEY`. To install against GCS, set `PROVIDER=gcs` plus
`GCS_BUCKET_NAME` / `GCS_SERVICE_ACCOUNT_KEY_FILE` (path to the downloaded
service account JSON key file).

## Features

- Date-range loading with per-file progress; filters for **space, actor,
  action**, plus a free-text **search** over entity IDs, request paths, actor
  and space names — charts, table and event count all follow the filtered set.
- Three charts (events over time, top actors, actions) and a paginated table
  showing time, action, actor, entity, space and request per event.
- **Name resolution:** actor IDs resolve to real names via the current
  space's member list, and the current space's ID resolves to its name.
  Contentful blocks org-scoped CMA calls from inside app iframes ("You can
  not access the action … from within an app"), so actors who are not
  members of the space the app runs in — and users who have left the org —
  remain as raw IDs. Composite IDs like `space/master/appId` are app
  (machine) identities.

## Design notes & limits

- The app displays **whatever audit logs are in the bucket** — Contentful
  delivers one org's logs per configured destination, but the viewer itself
  does not filter by org, and the org that delivers logs does not need to be
  the org where the app is installed. (Contentful's "Test connection" file
  `contentful-audit-logging-connection-test.txt` is ignored by the filename
  filter.)
- One app action `listAuditLogFiles(startDate, endDate)` returns at most 120
  presigned URLs (`truncated: true` beyond that — narrow the range).
- Audit files are flat daily objects named
  `contentful-audit-<orgId>-<datetime>.json`; each covers the **previous** day.
  Date filtering parses the filename; there is no key partitioning.
- The parser tolerates gzip/plain and JSON-array/single-object/NDJSON layouts,
  since Contentful documents only ".json".
- Aggregation happens client-side from the already-downloaded events, keeping
  the Function inside its CPU/time limits and the 32 MB response cap.
- Storage access is behind `functions/lib/storage/` (`LogStorageProvider`);
  S3, Azure Blob and GCS are implemented, and further providers can be added
  without touching the handler or UI.
