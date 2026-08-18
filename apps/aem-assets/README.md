# Adobe Experience Manager Asset Selector

After you've installed the Adobe Experience Manager Asset Selector app, you can select media from your Adobe Experience Manager (AEM) as a Cloud Service Assets repository directly inside the Contentful web app, using Adobe's Content Advisor asset picker.

## Overview

This app lets editors browse, select, sort, and remove AEM DAM assets from a Contentful entry field, without leaving Contentful. Authentication uses Adobe's IMS (Identity Management System) OAuth flow via a popup window.

## Configuration

### Installation Parameters

| Field | Required | Description |
| --- | --- | --- |
| IMS Client ID | Yes | Client ID from Adobe IMS. Must be requested from Adobe support — not the standard Adobe Developer Console. |
| IMS Organization | Yes | The Adobe Identity Management System (IMS) ID provided by Adobe when provisioning Adobe AEM CS for your organization. |
| Repository ID | No | Restricts the asset selector to a single repository. [The AEM Tier and Environment values are ignored if a Repository value is provided.] |
| AEM Tier | No | Restricts the asset selector to repositories in the selected tier(s). [Only used if a Repository value is not provided.] |
| Environment | No | Restricts the asset selector to repositories in the selected environment. [Only used if a Repository value is not provided.] |
| Assets URL Root | No | Specifies the root domain and path for constructing assets' URLs. [Used for generating tier or environment specific URLs] |
| Prefill Selected Assets | No | Specifies if selected assets are pre-selected in the asset picker. |
| Hide Asset Upload Button | No | Specifies if the upload button is displayed in the asset picker. |

### Instance Parameters

| Field | Required | Description |
| --- | --- | --- |
| Hide Tree Nav | Yes | Specifies whether to show or hide the assets tree navigation sidebar |
| Selection Type | No | Specifies if the field supports single or multiple asset selection. |

## Important setup requirement: origin allowlisting

Adobe enforces CORS/origin allowlisting on their IMS auth endpoint. **The exact origin this app is hosted from must be allowlisted by Adobe support on your IMS Client ID before authentication will work.** This is required in addition to the IMS Client ID and Organization fields above, and must be requested directly from Adobe support.

## Learn more

Built on [`@contentful/dam-app-base`](https://www.npmjs.com/package/@contentful/dam-app-base). Learn more about the App Framework in our [documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/).
