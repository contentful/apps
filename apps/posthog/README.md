# PostHog Analytics Contentful App

This app integrates PostHog analytics directly into the Contentful Entry Sidebar. It provides real-time traffic data and session replay links for your content entries.

## 🚀 PostHog Setup Instructions

To use this app, you need an active PostHog account. Follow these steps to get your project ready:

### 1. PostHog Onboarding
When you see the "Which products would you like to use?" screen, select the following products:

* **Product Analytics** Required for pageviews and unique user counts)
* **Web Analytics** (Recommended for traffic trends)
* **Session Replay** (Required for the session recordings feature)

After selecting your products, click **Go** to continue setup.

### 2. Get your Credentials
You will need three pieces of information from PostHog:

1.  **Project ID**: Look at your browser URL while in PostHog. The numeric ID after `/project/` is your Project ID.
2.  **Project API Key**: Found in **Project Settings** -> **API Keys**. This is the "Public" key.
3.  **Personal API Key**: 
    *   Go to **Account Settings** (click your name in the bottom left) -> **Personal API Keys**.
    *   Click **+ Create Personal API Key**.
    *   **CRITICAL**: For security, give this key **ONLY** the following scopes:
        *   `Project Read`
        *   `Query Read`
        *   `Session Recording Read`
    *   Do **NOT** grant any "Write" or "Delete" permissions.

---

## ⚙️ Contentful Configuration

Once you have your keys, install the app in Contentful and fill out the configuration screen:

*   **PostHog Host**: Select "US Cloud" (`app.posthog.com`) or "EU Cloud" (`eu.posthog.com`) based on where your data is stored.
*   **URL Mapping Builder**: This is the most important part. You must tell the app how to find your content on your live website.
    *   **Content Type ID**: The API ID of your content type (e.g., `blogPost`).
    *   **URL Pattern**: The full URL pattern using `{slug}` as a placeholder for your entry's slug field.
    *   *Example*: `https://yoursite.com/blog/{slug}`

---

## 🛠 Available Scripts

In the project directory, you can run:

#### `npm start`
Runs the app in development mode.

#### `npm run build`
Builds the app for production to the `build` folder.

#### `npm test`
Runs the unit and component tests using Vitest.

---

## 📚 Learn More
*   [PostHog HogQL Documentation](https://posthog.com/docs/hogql)
*   [Contentful App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/)
*   [Forma 36 Design System](https://f36.contentful.com/)