# Google Docs Eval App

An internal Contentful marketplace app that lists completed Google Drive Integration agent runs and scores them using automated eval scorers.

Install this app alongside the Google Drive Integration app in any space where your team does manual testing. After running a workflow in the Google Docs app, switch to the **Eval** page in this app to score the run.

## Architecture

```
Contentful space (frontend app)
  └── Page: lists completed runs via sdk.cma.agentRun.getMany
  └── "Score" button → POST /score to Lambda

Scoring Lambda (AWS, account 017078452822)
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

In the AWS console for account `017078452822` (`cf-proddev-apps-production`):

1. Go to **Amazon Bedrock → Model access**
2. Ensure **Claude 3.5 Sonnet** is enabled

### 2. Attach this IAM policy to the Lambda execution role

The Lambda's execution role needs permission to invoke the Marketplace team's cross-account Bedrock inference profile (in account `193685726012`).

Create an inline policy on the role with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": [
        "arn:aws:bedrock:us-east-1:193685726012:application-inference-profile/hg5gx07uftvv",
        "arn:aws:bedrock:us-east-1:193685726012:application-inference-profile/ldnf79uqf5g3"
      ]
    }
  ]
}
```

> The first ARN is the Marketplace team Sonnet profile, the second is Haiku.
> Both are in account `193685726012` (`cf-core-ai-platform`).
> See the [Bedrock ARN list in Confluence](https://contentful.atlassian.net/wiki/spaces/ENG/pages/6301581406) for the full team list.

### 3. Trust policy on the Bedrock account side (if cross-account)

If Bedrock cross-account invocation requires a resource-based trust, the `cf-core-ai-platform` account admin may need to add a trust statement allowing the Lambda role from `017078452822` to invoke the profile. Check with the Core AI team if you get a 403 on inference.

---

## Lambda Deployment

```bash
cd lambda
npm install
STAGE=test npm run deploy:test   # deploys to google-docs-eval-test.api.ctf-apps.com
STAGE=prod npm run deploy        # deploys to google-docs-eval.api.ctf-apps.com
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

- **Scoring Lambda URL**: the base URL of your deployed Lambda, e.g. `https://google-docs-eval-test.api.ctf-apps.com`

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
