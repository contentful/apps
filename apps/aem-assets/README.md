# Adobe Experience Manager Asset Selector

After you've installed the Adobe Experience Manager Asset Selector app, you can select media from your Adobe Experience Manager (AEM) as a Cloud Service Assets repository directly inside the Contentful web app, using Adobe's Content Advisor asset picker.

## Overview

This app lets editors browse, select, sort, and remove AEM DAM assets from a Contentful entry field, without leaving Contentful. Authentication uses Adobe's IMS (Identity Management System) OAuth flow via a popup window.

## Configuration

| Field | Required | Description |
| --- | --- | --- |
| IMS Client ID | Yes | Client ID from Adobe IMS. Must be requested from Adobe support — not the standard Adobe Developer Console. |
| IMS Organization | Yes | The Adobe IMS org ID assigned when AEM as a Cloud Service was provisioned for your organization. |
| Repository ID | No | Restricts asset selection to a single AEM repository. |
| AEM Tier | No | Restricts the tier(s) searched (`delivery`, `author`). Defaults to both. |
| Environment | No | Specifies the AEM repository environment (`prod`, `stage`). |
| Hide Asset Upload Button | No | Hides the upload-to-AEM button inside the picker. Defaults to hidden. |

## Important setup requirement: origin allowlisting

Adobe enforces CORS/origin allowlisting on their IMS auth endpoint. **The exact origin this app is hosted from must be allowlisted by Adobe support on your IMS Client ID before authentication will work.** This is required in addition to the IMS Client ID and Organization fields above, and must be requested directly from Adobe support.

## Learn more

Built on [`@contentful/dam-app-base`](https://www.npmjs.com/package/@contentful/dam-app-base). Learn more about the App Framework in our [documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/).
