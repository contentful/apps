# Google Docs Eval App

> **Internal tool — not for customers.**
> This app is used by the Applied AI Solutions team to score Drive Integration agent runs during development and manual QA. It is not published to the Contentful Marketplace and should not be treated as a customer-facing product.
>
> **Ownership:** Applied AI Solutions team (10pines)

An internal Contentful app that lists completed Drive Integration agent runs and scores them using automated eval scorers.

Install this app alongside the Google Drive Integration app in any space where your team does manual testing. After running a workflow in the Google Docs app, switch to the **Eval** page in this app to score the run.

## Architecture

```
Contentful space (frontend app)
  └── Page: lists completed runs via sdk.cma.agentRun.getMany
  └── "Score" button → POST /score to Lambda

Scoring Lambda (AWS)
  ├── 3 deterministic scorers (no LLM):
  │     json-structure, referential-integrity, context-leak
  └── 4 LLM-judge scorers (AWS Bedrock, Claude):
        content-exhaustiveness, field-level-mapping,
        multi-type-recognition, table-handling
```

The Lambda invokes Bedrock using its **IAM execution role** — no API keys anywhere.

---

## AWS Setup (one-time)

### 1. Enable Claude in Bedrock

In the AWS console (ask the Applied AI Solutions team for account details):

1. Go to **Amazon Bedrock → Model access**
2. Ensure **Claude 3.5 Sonnet** is enabled

### 2. Attach this IAM policy to the Lambda execution role

The Lambda's execution role needs permission to invoke the Marketplace team's cross-account Bedrock inference profile. Ask the Core AI Platform team for the correct ARNs for your environment, then create an inline policy on the Lambda role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": [
        "<sonnet-inference-profile-arn>",
        "<haiku-inference-profile-arn>"
      ]
    }
  ]
}
```

> See the Bedrock ARN list in Confluence for the full team list.

### 3. Trust policy on the Bedrock account side (if cross-account)

If Bedrock cross-account invocation requires a resource-based trust, the Core AI Platform team may need to add a trust statement allowing the Lambda role to invoke the profile. Check with them if you get a 403 on inference.

---

## Lambda Deployment

```bash
cd lambda
npm install
STAGE=test npm run deploy:test
STAGE=prod npm run deploy
```

Prerequisites: AWS CLI authenticated, Serverless Framework installed, custom domain already created.

---

## Frontend Deployment

```bash
npm install
npm run build
# Upload the build/ directory to your Contentful app definition
```

---

## App Configuration

After installing the app in a space, go to **App Configuration** and set:

- **Scoring Lambda URL**: the base URL of your deployed Lambda (ask the team for the correct URL for your environment)

---

## Scorers

| Scorer | Type | What it checks |
|---|---|---|
| `json-structure` | Deterministic | Output is valid JSON with `entries` and `assets` arrays |
| `referential-integrity` | Deterministic | All entry/asset links resolve to valid IDs in the output |
| `context-leak` | Deterministic | Internal `[[CTX]]` notes did not leak into the output |
| `content-exhaustiveness` | LLM judge | All content from the source document was mapped |
| `field-level-mapping` | LLM judge | Content was mapped to semantically correct fields |
| `multi-type-recognition` | LLM judge | Multi-section documents were split into correct content types |
| `table-handling` | LLM judge | Tables were handled correctly (data vs. presentational) |

Scores range from `0.0` (failure) to `1.0` (perfect). LLM scorers return `-1` if the Bedrock call fails.
